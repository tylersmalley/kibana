import { format as formatUrl } from 'url';
import { admin } from '../../../test/shield';

export const esTestConfig = new class EsTestConfig {
  getPort() {
    return parseInt(process.env.TEST_ES_PORT, 10) || 9220;
  }

  getUrl() {
    return formatUrl(this.getUrlParts());
  }

  getProtocol() {
    return process.env.TEST_ES_PROTOCOL || 'http';
  }

  getHostname() {
    return process.env.TEST_ES_HOSTNAME || 'localhost';
  }

  getAuth() {
    return `${this.getUsername()}:${this.getPassword()}`;
  }

  getUsername() {
    return admin.username;
  }

  getPassword() {
    return admin.password;
  }

  getUrlParts() {
    return {
      protocol: this.getProtocol(),
      hostname: this.getHostname(),
      port: this.getPort(),
      auth: this.getAuth(),
      username: this.getUsername(),
      password: this.getPassword()
    };
  }
};
