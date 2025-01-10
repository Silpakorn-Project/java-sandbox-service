import { IsString } from "class-validator";

export class CodeExecutionRequest {
    @IsString()
    sourceCode: string;
}
