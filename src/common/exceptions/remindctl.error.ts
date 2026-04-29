import { BadGatewayException } from '@nestjs/common';

export class RemindctlError extends BadGatewayException {
  constructor(
    message: string,
    public readonly exitCode: number,
    public readonly stderr: string,
  ) {
    super(message);
  }
}
