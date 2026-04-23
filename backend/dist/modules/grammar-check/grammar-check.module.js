"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrammarCheckModule = void 0;
const common_1 = require("@nestjs/common");
const grammar_check_service_1 = require("./grammar-check.service");
let GrammarCheckModule = class GrammarCheckModule {
};
exports.GrammarCheckModule = GrammarCheckModule;
exports.GrammarCheckModule = GrammarCheckModule = __decorate([
    (0, common_1.Module)({
        providers: [grammar_check_service_1.GrammarCheckService],
        exports: [grammar_check_service_1.GrammarCheckService],
    })
], GrammarCheckModule);
//# sourceMappingURL=grammar-check.module.js.map