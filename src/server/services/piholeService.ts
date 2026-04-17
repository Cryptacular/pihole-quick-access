export interface IPiholeService {
  getDnsBlockingStatus(): Promise<{
    blocking: "enabled" | "disabled" | "failed" | "unknown";
    timer: number | null;
  }>;
  changeDnsBlockingStatus(
    blocking: boolean,
    timer: number | null,
  ): Promise<{
    blocking: "enabled" | "disabled" | "failed" | "unknown";
    timer: number | null;
  }>;
}

export class PiholeService implements IPiholeService {
  private readonly password: string;
  private readonly baseUrl: string;
  private sessionId: string | null = null;
  private csrf: string | null = null;

  private get isAuthorised(): boolean {
    return this.sessionId !== null;
  }

  /**
   *
   */
  constructor(piholeAppPassword: string) {
    this.password = piholeAppPassword;
    this.baseUrl = process.env.PIHOLE_BASE_URL || "http://localhost";
  }

  private async fetch(uri: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    if (this.sessionId) {
      headers.set("X-FTL-SID", this.sessionId);
    }
    if (this.csrf) {
      headers.set("X-FTL-CSRF", this.csrf);
    }
    return await fetch(`${this.baseUrl}${uri}`, {
      ...init,
      headers,
    });
  }

  private async authenticate() {
    const payload = { password: this.password };

    const res = await this.fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(JSON.stringify(res));
      throw new Error(`Could not authenticate. Status: ${res.status}`);
    }

    const body = await res.json();

    if (!body) {
      throw new Error("Response body is empty");
    }

    if (body.error) {
      throw new Error(body.error);
    }

    this.sessionId = body.session.sid;
    this.csrf = body.session.csrf;
  }

  async getDnsBlockingStatus(): Promise<{
    blocking: "enabled" | "disabled" | "failed" | "unknown";
    timer: number | null;
  }> {
    if (!this.isAuthorised) {
      await this.authenticate();
    }

    const res = await this.fetch("/api/dns/blocking");

    if (!res.ok) {
      throw new Error("Could not retrieve DNS blocking status");
    }

    const body = await res.json();

    if (!body) {
      throw new Error("Response body is empty");
    }

    const { blocking, timer } = body;

    return {
      blocking,
      timer,
    };
  }

  async changeDnsBlockingStatus(
    blocking: boolean,
    timer: number | null,
  ): Promise<{
    blocking: "enabled" | "disabled" | "failed" | "unknown";
    timer: number | null;
    took: number;
  }> {
    if (!this.isAuthorised) {
      await this.authenticate();
    }

    const res = await this.fetch("/api/dns/blocking", {
      method: "POST",
      body: JSON.stringify({ blocking, timer }),
    });

    if (!res.ok) {
      throw new Error("Could not change DNS blocking status");
    }

    const body = await res.json();

    if (!body) {
      throw new Error("Response body is empty");
    }

    return body;
  }
}
