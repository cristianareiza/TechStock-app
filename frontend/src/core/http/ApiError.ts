export interface FieldIssue {
  field: string | null;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details: FieldIssue[];

  constructor(status: number, message: string, details: FieldIssue[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  fieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const issue of this.details) {
      if (issue.field && !errors[issue.field]) errors[issue.field] = issue.message;
    }
    return errors;
  }
}
