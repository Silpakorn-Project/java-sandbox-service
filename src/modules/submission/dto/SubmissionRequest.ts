import { Type } from "class-transformer";
import { IsNotEmpty, IsString, ValidateNested } from "class-validator";

export class TestCase {
    @IsString()
    @IsNotEmpty()
    input: string;

    @IsString()
    @IsNotEmpty()
    expected_output: string;
}

export class SubmissionRequest {
    @IsString()
    @IsNotEmpty()
    source_code: string;

    @ValidateNested()
    @Type(() => TestCase)
    test_cases: TestCase[];
}
