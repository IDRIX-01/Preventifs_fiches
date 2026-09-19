"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "instrumentation";
exports.ids = ["instrumentation"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "node:crypto":
/*!******************************!*\
  !*** external "node:crypto" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:crypto");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "(instrument)/./instrumentation.ts":
/*!****************************!*\
  !*** ./instrumentation.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   register: () => (/* binding */ register)\n/* harmony export */ });\nasync function register() {\n    if (true) {\n        const cron = await __webpack_require__.e(/*! import() */ \"vendor-chunks/node-cron\").then(__webpack_require__.bind(__webpack_require__, /*! node-cron */ \"(instrument)/./node_modules/node-cron/dist/node-cron.js\"));\n        const { generateWeeklyFiches } = await __webpack_require__.e(/*! import() */ \"_instrument_lib_generateFiches_ts\").then(__webpack_require__.bind(__webpack_require__, /*! @/lib/generateFiches */ \"(instrument)/./lib/generateFiches.ts\"));\n        // Tous les lundis à 10h00, heure d'Abidjan\n        cron.schedule(\"0 10 * * 1\", async ()=>{\n            console.log(\"[cron] G\\xe9n\\xe9ration hebdomadaire des fiches…\");\n            await generateWeeklyFiches();\n        }, {\n            timezone: \"Africa/Abidjan\"\n        });\n        console.log(\"[cron] T\\xe2che planifi\\xe9e : chaque lundi \\xe0 10h (Africa/Abidjan)\");\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vaW5zdHJ1bWVudGF0aW9uLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBTyxlQUFlQTtJQUNwQixJQUFJQyxJQUFxQyxFQUFFO1FBQ3pDLE1BQU1HLE9BQU8sTUFBTSxnTUFBbUI7UUFDdEMsTUFBTSxFQUFFQyxvQkFBb0IsRUFBRSxHQUFHLE1BQU0sa01BQThCO1FBRXJFLDJDQUEyQztRQUMzQ0QsS0FBS0UsUUFBUSxDQUNYLGNBQ0E7WUFDRUMsUUFBUUMsR0FBRyxDQUFDO1lBQ1osTUFBTUg7UUFDUixHQUNBO1lBQUVJLFVBQVU7UUFBaUI7UUFHL0JGLFFBQVFDLEdBQUcsQ0FBQztJQUNkO0FBQ0YiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9xaHNlLW1haW50ZW5hbmNlLy4vaW5zdHJ1bWVudGF0aW9uLnRzP2Q3ZDciXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZ2lzdGVyKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTkVYVF9SVU5USU1FID09PSBcIm5vZGVqc1wiKSB7XG4gICAgY29uc3QgY3JvbiA9IGF3YWl0IGltcG9ydChcIm5vZGUtY3JvblwiKTtcbiAgICBjb25zdCB7IGdlbmVyYXRlV2Vla2x5RmljaGVzIH0gPSBhd2FpdCBpbXBvcnQoXCJAL2xpYi9nZW5lcmF0ZUZpY2hlc1wiKTtcblxuICAgIC8vIFRvdXMgbGVzIGx1bmRpcyDDoCAxMGgwMCwgaGV1cmUgZCdBYmlkamFuXG4gICAgY3Jvbi5zY2hlZHVsZShcbiAgICAgIFwiMCAxMCAqICogMVwiLFxuICAgICAgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIltjcm9uXSBHw6luw6lyYXRpb24gaGViZG9tYWRhaXJlIGRlcyBmaWNoZXPigKZcIik7XG4gICAgICAgIGF3YWl0IGdlbmVyYXRlV2Vla2x5RmljaGVzKCk7XG4gICAgICB9LFxuICAgICAgeyB0aW1lem9uZTogXCJBZnJpY2EvQWJpZGphblwiIH1cbiAgICApO1xuXG4gICAgY29uc29sZS5sb2coXCJbY3Jvbl0gVMOiY2hlIHBsYW5pZmnDqWUgOiBjaGFxdWUgbHVuZGkgw6AgMTBoIChBZnJpY2EvQWJpZGphbilcIik7XG4gIH1cbn0iXSwibmFtZXMiOlsicmVnaXN0ZXIiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9SVU5USU1FIiwiY3JvbiIsImdlbmVyYXRlV2Vla2x5RmljaGVzIiwic2NoZWR1bGUiLCJjb25zb2xlIiwibG9nIiwidGltZXpvbmUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(instrument)/./instrumentation.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(instrument)/./instrumentation.ts"));
module.exports = __webpack_exports__;

})();