/**
 * Unit tests for Communication Hub
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { CommunicationHub } from '../src/communicationHub.js';

describe('CommunicationHub', () => {
  let hub;

  beforeEach(() => {
    hub = new CommunicationHub();
  });

  describe('Constructor', () => {
    it('should initialize with supported channels', () => {
      assert.ok(Array.isArray(hub.channels));
      assert.ok(hub.channels.includes('email'));
      assert.ok(hub.channels.includes('sms'));
      assert.ok(hub.channels.includes('slack'));
      assert.ok(hub.channels.includes('teams'));
      assert.ok(hub.channels.includes('phone'));
      assert.ok(hub.channels.includes('chat'));
    });

    it('should initialize integrations map', () => {
      assert.ok(hub.integrations instanceof Map);
    });
  });

  describe('sendNotification()', () => {
    it('should return error for unsupported channel', async () => {
      const result = await hub.sendNotification(
        'unsupported',
        'test@example.com',
        'Test message'
      );
      assert.strictEqual(result.success, false);
      assert.match(result.error, /not supported/);
    });

    it('should route to email channel', async () => {
      const result = await hub.sendNotification(
        'email',
        'test@example.com',
        'Test message'
      );
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.channel, 'email');
    });

    it('should route to SMS channel', async () => {
      const result = await hub.sendNotification(
        'sms',
        '+15551234567',
        'Test message'
      );
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.channel, 'sms');
    });
  });

  describe('sendEmail()', () => {
    it('should send email successfully', async () => {
      const result = await hub.sendEmail('test@example.com', 'Test message');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.channel, 'email');
      assert.ok(result.messageId);
      assert.ok(result.sentAt);
    });

    it('should generate unique message IDs', async () => {
      const result1 = await hub.sendEmail('test1@example.com', 'Message 1');
      const result2 = await hub.sendEmail('test2@example.com', 'Message 2');
      assert.notStrictEqual(result1.messageId, result2.messageId);
    });
  });

  describe('sendSms()', () => {
    it('should send SMS successfully with valid phone', async () => {
      const result = await hub.sendSms('+15551234567', 'Test message');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.channel, 'sms');
      assert.ok(result.segments);
    });

    it('should reject invalid phone number', async () => {
      const result = await hub.sendSms('invalid', 'Test message');
      assert.strictEqual(result.success, false);
      assert.match(result.error, /Invalid phone number/);
    });

    it('should calculate SMS segments correctly', async () => {
      const shortMessage = 'Short message';
      const longMessage = 'x'.repeat(300);

      const result1 = await hub.sendSms('+15551234567', shortMessage);
      const result2 = await hub.sendSms('+15551234567', longMessage);

      assert.ok(result1.segments < result2.segments);
    });
  });

  describe('sendSlack()', () => {
    it('should send Slack message successfully', async () => {
      const result = await hub.sendSlack('#general', 'Test message');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.channel, 'slack');
      assert.ok(result.payload);
    });

    it('should add high priority indicator', async () => {
      const result = await hub.sendSlack('#urgent', 'Urgent message', {
        priority: 'high',
      });
      assert.strictEqual(result.success, true);
      assert.ok(result.payload.attachments.some((a) => a.color === 'danger'));
    });

    it('should use custom username and icon', async () => {
      const result = await hub.sendSlack('#general', 'Test', {
        username: 'CustomBot',
        icon: ':smile:',
      });
      assert.strictEqual(result.payload.username, 'CustomBot');
      assert.strictEqual(result.payload.icon_emoji, ':smile:');
    });
  });

  describe('sendTeams()', () => {
    it('should send Teams message successfully', async () => {
      const result = await hub.sendTeams('channel-123', 'Test message');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.channel, 'teams');
      assert.ok(result.card);
    });

    it('should set red theme for high priority', async () => {
      const result = await hub.sendTeams('channel-123', 'Urgent message', {
        priority: 'high',
      });
      assert.strictEqual(result.card.themeColor, 'FF0000');
    });

    it('should set blue theme for normal priority', async () => {
      const result = await hub.sendTeams('channel-123', 'Normal message');
      assert.strictEqual(result.card.themeColor, '0078D7');
    });
  });

  describe('sendPhone()', () => {
    it('should initiate phone call successfully', async () => {
      const result = await hub.sendPhone('+15551234567', 'Test message');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.channel, 'phone');
      assert.strictEqual(result.status, 'initiated');
      assert.ok(result.callId);
    });
  });

  describe('sendChat()', () => {
    it('should send chat message successfully', async () => {
      const result = await hub.sendChat('user-123', 'Test message');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.channel, 'chat');
      assert.ok(result.messageId);
    });
  });

  describe('broadcastToTeam()', () => {
    it('should broadcast to multiple channels', async () => {
      const result = await hub.broadcastToTeam('System maintenance', 'high');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.broadcast, true);
      assert.ok(Array.isArray(result.channels));
      assert.ok(result.channels.length >= 3);
    });
  });

  describe('notifyHighPriorityTicket()', () => {
    it('should send notifications to multiple channels', async () => {
      const ticketData = {
        reportId: 'TR-12345',
        customerName: 'John Doe',
        ticketSubject: 'Urgent issue',
        department: 'Technology',
      };

      const result = await hub.notifyHighPriorityTicket(ticketData);
      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.notifications));
      assert.strictEqual(result.ticketId, 'TR-12345');
    });
  });

  describe('isValidPhoneNumber()', () => {
    it('should accept valid international format', () => {
      assert.ok(hub.isValidPhoneNumber('+15551234567'));
      assert.ok(hub.isValidPhoneNumber('+442071234567'));
      assert.ok(hub.isValidPhoneNumber('+33123456789'));
    });

    it('should accept phone with spaces and dashes', () => {
      assert.ok(hub.isValidPhoneNumber('+1 555-123-4567'));
      assert.ok(hub.isValidPhoneNumber('+1 (555) 123-4567'));
    });

    it('should reject invalid formats', () => {
      assert.ok(!hub.isValidPhoneNumber('123'));
      assert.ok(!hub.isValidPhoneNumber('abcdefg'));
      assert.ok(!hub.isValidPhoneNumber(''));
    });
  });

  describe('generateMessageId()', () => {
    it('should generate unique IDs', () => {
      const id1 = hub.generateMessageId();
      const id2 = hub.generateMessageId();
      assert.notStrictEqual(id1, id2);
    });

    it('should start with MSG- prefix', () => {
      const id = hub.generateMessageId();
      assert.ok(id.startsWith('MSG-'));
    });
  });

  describe('getConversationHistory()', () => {
    it('should return error when database not configured', async () => {
      const result = await hub.getConversationHistory('TR-12345');
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('getChannelPreferences()', () => {
    it('should return default preferences when database not configured', async () => {
      const result = await hub.getChannelPreferences('user-123');
      assert.strictEqual(result.success, true);
      assert.ok(result.preferences);
      assert.strictEqual(typeof result.preferences.email, 'boolean');
    });
  });

  describe('updateChannelPreferences()', () => {
    it('should return error when database not configured', async () => {
      const result = await hub.updateChannelPreferences('user-123', {
        email: true,
        sms: false,
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });
});
