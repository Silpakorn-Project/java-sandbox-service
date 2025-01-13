import { RunTestResponseModel } from "@app/modules/sandbox/models/ResponseModel";

export class SubmissionResponseModel {
    passed: boolean;
    testcase_total: number;
    testcase_passed: number;
    testcase_wrong: number;
    test_cases: RunTestResponseModel[];
}
