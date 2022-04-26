const express = require('express');
const router = express.Router();
const handlerFilter = require('./handlers/handlerFilter');
const handlerGraf = require('./handlers/handlerGraf');

/**
 * Alla API endpoints defineras nedan med tillhörande handler och dess funktioner
 */

/*Filtrering*/
router.get('/program/koder', handlerFilter.getProgramKoder);
router.get('/program/kurser', handlerFilter.getKurserFranProgram);
router.get('/program/datum', handlerFilter.getProgramStartDatum);
router.get('/kurs/datum', handlerFilter.getKursAntagningsDatum);

/*Grafer*/
router.get('/program/CSN', handlerGraf.getCSN);
router.get('/program/slapande', handlerGraf.getSlapande);
router.get('/betygsfordelning', handlerGraf.getBetygsfordelning);
router.get('/kurser/avhopp', handlerGraf.getAvhopp);
router.get('/kurser/evaliuate', handlerGraf.getEvaliuate);
router.get('/omtenta', handlerGraf.getOmtenta);

/*Detta ska göras om*/
router.get('/kurser/avslut', handlerGraf.getDagarPerKurs);
router.get('/kurser/registrering', handlerGraf.getKursRegistreringsTillfallen);

/*in progress*/
router.get('/kurser/dagar', handlerGraf.getDagarNew);

module.exports = router;
