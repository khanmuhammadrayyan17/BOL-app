"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const reading_module_1 = require("./modules/reading/reading.module");
const comprehension_module_1 = require("./modules/comprehension/comprehension.module");
const tongue_twister_module_1 = require("./modules/tongue-twister/tongue-twister.module");
const grammar_check_module_1 = require("./modules/grammar-check/grammar-check.module");
const conversation_module_1 = require("./modules/conversation/conversation.module");
const vocabulary_module_1 = require("./modules/vocabulary/vocabulary.module");
const description_module_1 = require("./modules/description/description.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            reading_module_1.ReadingModule,
            comprehension_module_1.ComprehensionModule,
            tongue_twister_module_1.TongueTwisterModule,
            grammar_check_module_1.GrammarCheckModule,
            conversation_module_1.ConversationModule,
            vocabulary_module_1.VocabularyModule,
            description_module_1.DescriptionModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map