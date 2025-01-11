import { IsNotEmpty, IsString } from "class-validator";

export class CodeExecutionRequest {
    @IsString()
    @IsNotEmpty()
    sourceCode: string;
}
