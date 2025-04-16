import { RunTestResponseModel } from "@app/modules/sandbox/models/ResponseModel";
import { TestCase } from "../dto/SubmissionRequest";

export class SubmissionResponseModel {
    passed: boolean;
    testcase_total: number;
    testcase_passed: number;
    testcase_wrong: number;
    test_cases: RunTestResponseModel[];

    public static makeFromTestcasesAndTestResults(
        testCases: TestCase[],
        testResults: RunTestResponseModel[],
    ) {
        return {
            passed: testResults.every((result) => result.passed),
            testcase_total: testCases.length,
            testcase_passed: testResults.filter(
                (result) => result.passed,
            ).length,
            testcase_wrong: testResults.filter(
                (result) => !result.passed,
            ).length,
            test_cases: testResults,
        }
    }
}
