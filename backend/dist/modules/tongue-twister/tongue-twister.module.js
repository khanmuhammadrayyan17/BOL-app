"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TongueTwisterModule = void 0;
const common_1 = require("@nestjs/common");
const tongue_twister_service_1 = require("./tongue-twister.service");
let TongueTwisterModule = class TongueTwisterModule {
};
exports.TongueTwisterModule = TongueTwisterModule;
exports.TongueTwisterModule = TongueTwisterModule = __decorate([
    (0, common_1.Module)({
        providers: [tongue_twister_service_1.TongueTwisterService],
        exports: [tongue_twister_service_1.TongueTwisterService],
    })
], TongueTwisterModule);
//# sourceMappingURL=tongue-twister.module.js.map