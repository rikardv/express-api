const express = require("express");
const router = express.Router();
const handler = require("./handlers/handler");

/**
 * Alla API endpoints defineras nedan med tillhörande handler och dess funktioner
 */

/* Testing endpoints */
router.get("/test/betyg", handler.getBetyg);
router.get("/test/avbrott", handler.getAvbrott);

/*Kursavlut endpoints*/
router.get("/kurser/avslut", handler.getDagar);
router.get("/kurser/registrering", handler.getKursRegistreringsTillfallen);
router.get("/kurser/antalStudenter", handler.getAntalStudenter);
/*Utvärderingsbetyg för kurser endpoints */
router.get("/kurser/betyg", handler.getKursUtvarderingsBetyg);

/*Program endpoints */
router.get("/program/kurser", handler.getKurserFranProgram);
router.get("/program/koder", handler.getProgramKoder);
router.get("/program/slapande", handler.getStudenterMedSlapande);

module.exports = router;
