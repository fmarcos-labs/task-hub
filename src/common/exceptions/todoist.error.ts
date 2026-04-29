import { BadGatewayException } from '@nestjs/common';

export class TodoistApiError extends BadGatewayException {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}
