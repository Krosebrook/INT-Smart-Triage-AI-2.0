import { Logger, LogLevel, logger } from '../lib/log';

// Mock console.log to capture output
let consoleOutput: string[] = [];
const originalConsoleLog = console.log;

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((message) => {
    consoleOutput.push(message);
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('Logger', () => {
  describe('Structured Logging', () => {
    it('should output JSON lines with correct structure', () => {
      logger.info('test.event', { key: 'value' });
      
      expect(consoleOutput).toHaveLength(1);
      const logEntry = JSON.parse(consoleOutput[0]);
      
      expect(logEntry).toHaveProperty('ts');
      expect(logEntry).toHaveProperty('level', LogLevel.INFO);
      expect(logEntry).toHaveProperty('event', 'test.event');
      expect(logEntry).toHaveProperty('props', { key: 'value' });
    });

    it('should handle all log levels', () => {
      logger.debug('debug.event');
      logger.info('info.event');
      logger.warn('warn.event');
      logger.error('error.event');
      
      expect(consoleOutput).toHaveLength(4);
      
      const debugLog = JSON.parse(consoleOutput[0]);
      const infoLog = JSON.parse(consoleOutput[1]);
      const warnLog = JSON.parse(consoleOutput[2]);
      const errorLog = JSON.parse(consoleOutput[3]);
      
      expect(debugLog.level).toBe(LogLevel.DEBUG);
      expect(infoLog.level).toBe(LogLevel.INFO);
      expect(warnLog.level).toBe(LogLevel.WARN);
      expect(errorLog.level).toBe(LogLevel.ERROR);
    });

    it('should include timestamp in ISO format', () => {
      logger.info('timestamp.test');
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Verify it's a valid date
      const timestamp = new Date(logEntry.ts);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should handle logging without props', () => {
      logger.info('no.props.event');
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.props).toBeUndefined();
    });
  });

  describe('Data Redaction', () => {
    it('should redact userId fields', () => {
      logger.info('user.test', { 
        userId: 'secret123',
        user_id: 'anothersecret',
        normalField: 'visible'
      });
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.props.userId).toBe('[REDACTED: 9 chars]');
      expect(logEntry.props.user_id).toBe('[REDACTED: 13 chars]');
      expect(logEntry.props.normalField).toBe('visible');
    });

    it('should redact long inquiry strings', () => {
      const longInquiry = 'This is a very long inquiry that contains sensitive user information and should be redacted because it exceeds the 50 character limit for content.';
      
      logger.info('inquiry.test', { inquiry: longInquiry });
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.props.inquiry).toBe(`[REDACTED: ${longInquiry.length} chars]`);
    });

    it('should not redact short strings', () => {
      logger.info('short.string.test', { 
        shortString: 'OK',
        mediumString: 'This is medium length but under 50 chars'
      });
      
      const logEntry = JSON.parse(consoleOutput[0]);
      expect(logEntry.props.shortString).toBe('OK');
      expect(logEntry.props.mediumString).toBe('This is medium length but under 50 chars');
    });

    it('should redact sensitive headers', () => {
      logger.info('headers.test', {
        headers: {
          'authorization': 'Bearer secret-token',
          'x-api-key': 'secret-key',
          'cookie': 'session=secret',
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0...'
        }
      });
      
      const logEntry = JSON.parse(consoleOutput[0]);
      const headers = logEntry.props.headers;
      
      expect(headers.authorization).toBe('[REDACTED]');
      expect(headers['x-api-key']).toBe('[REDACTED]');
      expect(headers.cookie).toBe('[REDACTED]');
      expect(headers['content-type']).toBe('application/json');
      expect(headers['user-agent']).toBe('Mozilla/5.0...');
    });

    it('should handle nested objects with sensitive data', () => {
      logger.info('nested.test', {
        user: {
          userId: 'secret123',
          name: 'John Doe',
          session: {
            token: 'secret-token',
            expires: '2023-01-01'
          }
        },
        request: {
          headers: {
            authorization: 'Bearer token'
          }
        }
      });
      
      const logEntry = JSON.parse(consoleOutput[0]);
      const { user, request } = logEntry.props;
      
      expect(user.userId).toBe('[REDACTED: 9 chars]');
      expect(user.name).toBe('John Doe');
      expect(user.session.token).toBe('[REDACTED: 12 chars]');
      expect(user.session.expires).toBe('2023-01-01');
      expect(request.headers.authorization).toBe('[REDACTED]');
    });

    it('should handle arrays with sensitive data', () => {
      logger.info('array.test', {
        users: [
          { userId: 'user1', name: 'Alice' },
          { userId: 'user2', name: 'Bob' }
        ],
        inquiries: [
          'Short inquiry',
          'This is a much longer inquiry that should be redacted because it exceeds the character limit and might contain sensitive information'
        ]
      });
      
      const logEntry = JSON.parse(consoleOutput[0]);
      const { users, inquiries } = logEntry.props;
      
      expect(users[0].userId).toBe('[REDACTED: 5 chars]');
      expect(users[0].name).toBe('Alice');
      expect(users[1].userId).toBe('[REDACTED: 5 chars]');
      expect(users[1].name).toBe('Bob');
      
      expect(inquiries[0]).toBe('Short inquiry');
      expect(inquiries[1]).toMatch(/^\[REDACTED: \d+ chars\]$/);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should use the same instance as the exported logger', () => {
      const instance = Logger.getInstance();
      expect(instance).toBe(logger);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      logger.info('null.test', {
        nullValue: null,
        undefinedValue: undefined,
        zeroValue: 0,
        emptyString: '',
        falseValue: false
      });
      
      const logEntry = JSON.parse(consoleOutput[0]);
      const props = logEntry.props;
      
      expect(props.nullValue).toBeNull();
      expect(props.undefinedValue).toBeUndefined();
      expect(props.zeroValue).toBe(0);
      expect(props.emptyString).toBe('');
      expect(props.falseValue).toBe(false);
    });

    it('should handle circular references without infinite recursion', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;
      
      // This should not throw an error or cause infinite recursion
      expect(() => {
        logger.info('circular.test', { data: obj });
      }).not.toThrow();
      
      expect(consoleOutput).toHaveLength(1);
    });

    it('should handle very deep nested objects', () => {
      const deepObj = {
        level1: {
          level2: {
            level3: {
              level4: {
                userId: 'deep-secret',
                value: 'deep-value'
              }
            }
          }
        }
      };
      
      logger.info('deep.test', deepObj);
      
      const logEntry = JSON.parse(consoleOutput[0]);
      // Should handle deep nesting without issues
      expect(logEntry.props.level1.level2.level3.level4.userId).toBe('[REDACTED: 11 chars]');
      expect(logEntry.props.level1.level2.level3.level4.value).toBe('deep-value');
    });
  });
});