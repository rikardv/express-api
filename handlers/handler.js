/**
 * Functions for handling request
 * Calls sqlQuery function from utils and gets data from database
 */

const utils = require('../setup/utils');

module.exports = {
  getBetyg: async (req, res) => {
    let result = [];
    result = await utils.sqlQuery(
      'SELECT BETYGSVARDE AS betyg, COUNT(BETYGSVARDE) AS antal FROM io_studieresultat WHERE UTBILDNING_KOD="TNG033" GROUP BY BETYGSVARDE'
    );

    res.status(200).send({
      data: result,
    });
  },

  getAvbrott: async (req, res) => {
    let result = [];

    result = await utils.sqlQuery(
      'SELECT UTBILDNING_KOD as kurskod, COUNT(AVBROTT_UTBILDNING) as avbrott FROM io_studieresultat WHERE YTTERSTA_KURSPAKETERING_SV = "Civilingenjörsprogram i medieteknik" GROUP BY UTBILDNING_KOD ORDER BY avbrott DESC LIMIT 20'
    );
    res.status(200).send({
      data: result,
    });
  },

  //Hämtar kuser med tillhörande år/termin. Summerar ihop kursutväerderingsbetygen och tar fram ett snittbetyg (SNITT_BETYG).
  //Tar in antalet som parameter
  getKursUtvarderingsBetyg: async (req, res) => {
    let result = [];
    let limit = req.query.limit;
    result = await utils.sqlQuery(
      //Quearyn har för tillfället en DESC LIMIT på 10
      'SELECT `UTBILDNING_KOD`,CONCAT(`AR`,`TERMIN`) AS PERIOD,((`ANDEL_INNEHALL_5`*5+`ANDEL_INNEHALL_4`*4+`ANDEL_INNEHALL_3`*3+`ANDEL_INNEHALL_2`*2+`ANDEL_INNEHALL_1`)/`ANTAL_SVAR`) AS "SNITT_BETYG" FROM evaliuate ORDER BY UTBILDNING_KOD' +
        ` DESC LIMIT ${limit}`
    );
    tempRes = [];
    var kurs = new Object();
    kurs.name = result[0].UTBILDNING_KOD;

    //Kass loop för att formatera daten till ReCharts....
    result.forEach((element) => {
      //För första iterationen
      if (kurs.name != element.UTBILDNING_KOD) {
        tempRes.push(kurs);
        kurs = new Object();
        kurs.name = element.UTBILDNING_KOD;
      }

      if (kurs.name == element.UTBILDNING_KOD) {
        var key = element.PERIOD;
        kurs[key] = element.SNITT_BETYG;
      }
    });
    tempRes.push(kurs);
    result = tempRes;
    res.status(200).send({
      data: result,
    });
  },

  getKurserFranProgram: async (req, res) => {
    //Hämtar alla kurser som tillhör parametern
    //Paramemtern hämtas genom att läsa av URL Tex: http://localhost:8080/getKurserFranProgram?kurskoden=6CDDD, Där parametern paseras på vad som skrivs efter "?"

    //RIKARD! Hojta till om du vill ha det på ett annat sätt :P

    let kursKod = req.query.kurskoden;
    var param = [kursKod];
    console.log(kursKod);
    let result = [];

    quary =
      'SELECT DISTINCT `UTBILDNING_KOD`,`UTBILDNING_SV` FROM `io_registrering` WHERE `YTTERSTA_KURSPAKETERING_KOD` = ?';

    result = await utils.sqlQuery(quary, kursKod);
    res.status(200).send({
      data: result,
    });
  },

  getProgramKoder: async (req, res) => {
    //Hämtar alla programkoder i DT
    let result = [];

    result = await utils.sqlQuery(
      'SELECT DISTINCT `YTTERSTA_KURSPAKETERING_KOD`,`YTTERSTA_KURSPAKETERING_SV`FROM io_registrering'
    );
    res.status(200).send({
      data: result,
    });
  },

  getProgramStartDatum: async (req, res) => {
    let programkod = req.query.program;
    result = await getProgramStartDatum(programkod);

    res.status(200).send({
      data: result,
    });
  },

  getStudenterMedSlapande: async (req, res) => {
    let programkod = req.query.program;
    let start_datum = req.query.startdatum;

    let create_reg = await utils.sqlQuery(
      'CREATE TABLE TEMP_REG AS SELECT UTBILDNING_KOD,PERSONNUMMER FROM IO_REGISTRERING WHERE YTTERSTA_KURSPAKETERING_KOD=? AND YTTERSTA_KURSPAKETERINGSTILLFALLE_STARTDATUM=? AND STUDIEPERIOD_STARTDATUM >= ? AND STUDIEPERIOD_SLUTDATUM <= "2022-02-23"',
      [programkod, start_datum, start_datum]
    );
    let create_res = await utils.sqlQuery(
      'CREATE TABLE TEMP_RES AS SELECT UTBILDNING_KOD,AVSER_HEL_KURS,PERSONNUMMER FROM IO_STUDIERESULTAT WHERE YTTERSTA_KURSPAKETERING_KOD=? AND YTTERSTA_KURSPAKETERINGSTILLFALLE_STARTDATUM=? AND UTBILDNINGSTILLFALLE_STARTDATUM >= ?',
      [programkod, start_datum, start_datum]
    );

    let person_nummer = await utils.sqlQuery(
      'SELECT DISTINCT PERSONNUMMER FROM TEMP_REG'
    );

    let res_arr = [];
    let timer = 0;
    for (var i = 0; i < person_nummer.length; i++) {
      let actual_completed = await utils.sqlQuery(
        'SELECT COUNT(DISTINCT UTBILDNING_KOD) as antal FROM TEMP_RES WHERE AVSER_HEL_KURS = 1 AND PERSONNUMMER = ?',
        person_nummer[i].PERSONNUMMER
      );

      let should_be_completed = await utils.sqlQuery(
        'SELECT COUNT(DISTINCT UTBILDNING_KOD) as antal FROM TEMP_REG WHERE PERSONNUMMER = ?',
        person_nummer[i].PERSONNUMMER
      );

      let diff = should_be_completed[0].antal - actual_completed[0].antal;

      res_arr[i] = diff;

      process.stdout.write(
        'Loading ' + timer + '/' + person_nummer.length + '\r'
      );
      timer++;
    }

    const obj = [];
    for (var i = 0; i < res_arr.length; i++) {
      obj.push({
        name: res_arr[i],
        value: 0,
      });
    }

    var sum_arr = Object.values(
      obj.reduce((c, { name, value }) => {
        c[name] = c[name] || { name, value: 0 };
        c[name].value += 1;
        return c;
      }, {})
    );

    let sum_arr_sorted = sum_arr.sort(function (a, b) {
      return a.name - b.name;
    });

    let drop_temp_res = await utils.sqlQuery('DROP TABLE TEMP_RES');
    let drop_temp_reg = await utils.sqlQuery('DROP TABLE TEMP_REG');

    res.status(200).send({
      data: sum_arr_sorted,
    });
  },
};

let getProgramStartDatum = async (programkod) => {
  let start_dates = await utils.sqlQuery(
    'SELECT DISTINCT YTTERSTA_KURSPAKETERINGSTILLFALLE_STARTDATUM FROM `io_registrering` WHERE YTTERSTA_KURSPAKETERING_KOD=? ORDER BY YTTERSTA_KURSPAKETERINGSTILLFALLE_STARTDATUM DESC',
    programkod
  );

  return start_dates;
};
