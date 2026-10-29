import { AppError } from "../server/auth";
export interface BusinessProfileProvider {
  getCapabilities(): object;
  getProfile(): Promise<object>;
  validateChange(change: any): void;
  prepareChange(change: any): Promise<object>;
  applyApprovedChange(
    change: any,
    approval: any,
    evidence?: string,
  ): Promise<object>;
  getChangeStatus(change: any): object;
}
export class ManualNaverProvider implements BusinessProfileProvider {
  getCapabilities() {
    return {
      mode: "manual",
      read: false,
      automaticWrite: false,
      evidenceRequired: true,
    };
  }
  async getProfile() {
    return {
      status: "UNAVAILABLE",
      message: "승인된 담당자가 공식 관리자 화면에서 확인해 입력하세요.",
    };
  }
  validateChange(c: any) {
    if (!c.field || !c.proposed_value || !c.evidence)
      throw new AppError(400, "변경 필드·제안값·근거가 필요합니다.");
  }
  async prepareChange(c: any) {
    this.validateChange(c);
    return {
      steps: [
        "고객 사업장 관리 권한과 승인 증빙 확인",
        "공식 사업자 관리 화면에서 기존 값 확인",
        "승인된 값으로 수정",
        "적용 결과를 확인하고 증빙 기록",
      ],
      field: c.field,
      value: c.proposed_value,
      externalUpdatePerformed: false,
    };
  }
  async applyApprovedChange(c: any, a: any, evidence = "") {
    this.validateChange(c);
    if (!a || a.revoked_at)
      throw new AppError(403, "유효한 고객 승인이 필요합니다.");
    if (evidence.trim().length < 10)
      throw new AppError(
        400,
        "공식 화면에서 수행·확인한 결과 증빙을 10자 이상 기록하세요.",
      );
    return {
      execution_status: "MANUALLY_RECORDED",
      execution_evidence: evidence,
      externalUpdatePerformed: false,
    };
  }
  getChangeStatus(c: any) {
    return {
      status: c.execution_status,
      source: "operator_record",
      apiVerified: false,
    };
  }
}
export class ManualGoogleProvider extends ManualNaverProvider {}
export class GoogleBusinessProfileProvider extends ManualGoogleProvider {
  getCapabilities() {
    return {
      mode: "disabled",
      read: false,
      automaticWrite: false,
      evidenceRequired: true,
      reason: "실제 API 승인·OAuth 범위·고객 권한 검증 연동 미완료",
    };
  }
  async applyApprovedChange(): Promise<never> {
    throw new AppError(
      503,
      "Google Business Profile API 실행은 비활성화되어 있습니다. 수동 제공자를 사용하세요.",
    );
  }
}
export class FutureNaverOfficialProvider extends GoogleBusinessProfileProvider {}
export function provider(platform: string) {
  return platform === "naver"
    ? new ManualNaverProvider()
    : new ManualGoogleProvider();
}
