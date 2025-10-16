/**
 * Unit tests for Email Service
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { EmailService } from '../src/emailService.js';

describe('EmailService', () => {
  let emailService;

  beforeEach(() => {
    emailService = new EmailService();
  });

  describe('Constructor', () => {
    it('should initialize with templates', () => {
      assert.ok(emailService.templates);
      assert.strictEqual(typeof emailService.templates, 'object');
    });
  });

  describe('initializeTemplates()', () => {
    it('should have all required templates', () => {
      const templates = emailService.templates;
      assert.ok(templates.ticket_received);
      assert.ok(templates.ticket_assigned);
      assert.ok(templates.high_priority_alert);
      assert.ok(templates.resolution_confirmation);
      assert.ok(templates.follow_up_reminder);
      assert.ok(templates.knowledge_base_articles);
    });

    it('should have subject and template for each', () => {
      Object.values(emailService.templates).forEach((template) => {
        assert.ok(template.subject);
        assert.ok(template.template);
        assert.strictEqual(typeof template.subject, 'string');
        assert.strictEqual(typeof template.template, 'string');
      });
    });
  });

  describe('generateEmail()', () => {
    it('should generate email from template', () => {
      const email = emailService.generateEmail('ticket_received', {
        customerName: 'John Doe',
        reportId: 'TR-12345',
        priority: 'HIGH',
      });

      assert.ok(email.subject);
      assert.ok(email.body);
      assert.strictEqual(email.templateUsed, 'ticket_received');
    });

    it('should replace placeholders in subject', () => {
      const email = emailService.generateEmail('ticket_received', {
        reportId: 'TR-12345',
        customerName: 'John',
        priority: 'high',
        department: 'Tech',
        ticketSubject: 'Issue',
        nextSteps: 'Steps',
        estimatedTime: '1h',
        csrName: 'Agent',
      });

      assert.ok(email.subject.includes('TR-12345'));
    });

    it('should replace placeholders in body', () => {
      const email = emailService.generateEmail('ticket_received', {
        customerName: 'John Doe',
        reportId: 'TR-12345',
        priority: 'HIGH',
        department: 'Technology',
        ticketSubject: 'Server down',
        nextSteps: 'Immediate action',
        estimatedTime: '30 minutes',
        csrName: 'Support Team',
      });

      assert.ok(email.body.includes('John Doe'));
      assert.ok(email.body.includes('TR-12345'));
    });

    it('should throw error for non-existent template', () => {
      assert.throws(() => {
        emailService.generateEmail('non_existent', {});
      }, /Template .* not found/);
    });
  });

  describe('stripHTML()', () => {
    it('should remove HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const text = emailService.stripHTML(html);
      assert.strictEqual(text, 'Hello World');
    });

    it('should collapse whitespace', () => {
      const html = '<p>Hello    \n\n   World</p>';
      const text = emailService.stripHTML(html);
      assert.strictEqual(text, 'Hello World');
    });

    it('should handle empty string', () => {
      const text = emailService.stripHTML('');
      assert.strictEqual(text, '');
    });
  });

  describe('generateTrackingId()', () => {
    it('should generate unique tracking IDs', () => {
      const id1 = emailService.generateTrackingId();
      const id2 = emailService.generateTrackingId();
      assert.notStrictEqual(id1, id2);
    });

    it('should start with TRACK- prefix', () => {
      const id = emailService.generateTrackingId();
      assert.ok(id.startsWith('TRACK-'));
    });

    it('should contain timestamp and random string', () => {
      const id = emailService.generateTrackingId();
      const parts = id.split('-');
      assert.strictEqual(parts.length, 3);
      assert.strictEqual(parts[0], 'TRACK');
      assert.ok(!isNaN(parseInt(parts[1]))); // timestamp
      assert.ok(parts[2].length > 0); // random string
    });
  });

  describe('getNextSteps()', () => {
    it('should return high priority steps', () => {
      const steps = emailService.getNextSteps('high');
      assert.ok(steps.includes('30 minutes'));
    });

    it('should return medium priority steps', () => {
      const steps = emailService.getNextSteps('medium');
      assert.ok(steps.includes('2-4 hours'));
    });

    it('should return low priority steps', () => {
      const steps = emailService.getNextSteps('low');
      assert.ok(steps.includes('24 hours'));
    });

    it('should default to medium for unknown priority', () => {
      const steps = emailService.getNextSteps('unknown');
      assert.ok(steps.includes('2-4 hours'));
    });
  });

  describe('getEstimatedTime()', () => {
    it('should return correct time for each priority', () => {
      assert.strictEqual(emailService.getEstimatedTime('high'), '30 minutes');
      assert.strictEqual(emailService.getEstimatedTime('medium'), '2-4 hours');
      assert.strictEqual(emailService.getEstimatedTime('low'), '24 hours');
    });

    it('should default to medium for unknown priority', () => {
      assert.strictEqual(emailService.getEstimatedTime('unknown'), '2-4 hours');
    });
  });

  describe('sendEmail()', () => {
    it('should send email with template', async () => {
      const result = await emailService.sendEmail(
        'test@example.com',
        'ticket_received',
        {
          customerName: 'John',
          reportId: 'TR-123',
          priority: 'high',
          department: 'Tech',
          ticketSubject: 'Issue',
          nextSteps: 'Steps',
          estimatedTime: '1h',
          csrName: 'Agent',
        }
      );

      assert.strictEqual(result.success, true);
      assert.ok(result.emailData);
      assert.ok(result.trackingId);
    });

    it('should include HTML and text versions', async () => {
      const result = await emailService.sendEmail(
        'test@example.com',
        'ticket_received',
        {
          customerName: 'John',
          reportId: 'TR-123',
          priority: 'high',
          department: 'Tech',
          ticketSubject: 'Issue',
          nextSteps: 'Steps',
          estimatedTime: '1h',
          csrName: 'Agent',
        }
      );

      assert.ok(result.emailData.html);
      assert.ok(result.emailData.text);
    });
  });

  describe('sendTicketConfirmation()', () => {
    it('should send confirmation email', async () => {
      const reportData = {
        customerName: 'John Doe',
        reportId: 'TR-12345',
        priority: 'high',
        department: 'Technology',
        ticketSubject: 'Server down',
        customerEmail: 'customer@example.com',
      };

      const result = await emailService.sendTicketConfirmation(reportData);
      assert.strictEqual(result.success, true);
    });
  });

  describe('sendAssignmentNotification()', () => {
    it('should send assignment email', async () => {
      const reportData = {
        customerName: 'John Doe',
        reportId: 'TR-12345',
        department: 'Technology',
        customerEmail: 'customer@example.com',
      };
      const assignedTo = { name: 'Sarah Johnson' };

      const result = await emailService.sendAssignmentNotification(
        reportData,
        assignedTo
      );
      assert.strictEqual(result.success, true);
    });
  });

  describe('sendHighPriorityAlert()', () => {
    it('should send high priority alert', async () => {
      const reportData = {
        customerName: 'John Doe',
        reportId: 'TR-12345',
        customerEmail: 'customer@example.com',
      };
      const csrContact = {
        name: 'Sarah Johnson',
        email: 'sarah@intinc.com',
        phone: '555-1234',
      };

      const result = await emailService.sendHighPriorityAlert(
        reportData,
        csrContact
      );
      assert.strictEqual(result.success, true);
    });
  });

  describe('sendKnowledgeBaseArticles()', () => {
    it('should send KB articles email', async () => {
      const reportData = {
        customerName: 'John Doe',
        customerEmail: 'customer@example.com',
      };
      const articles = [
        { title: 'Article 1', category: 'Tech', url: '/kb/1' },
        { title: 'Article 2', category: 'Tech', url: '/kb/2' },
      ];

      const result = await emailService.sendKnowledgeBaseArticles(
        reportData,
        articles
      );
      assert.strictEqual(result.success, true);
    });
  });

  describe('scheduleFollowUp()', () => {
    it('should schedule follow-up email', async () => {
      const result = await emailService.scheduleFollowUp(
        'TR-12345',
        'customer@example.com',
        3
      );

      assert.strictEqual(result.success, true);
      assert.ok(result.scheduledFor);
      assert.strictEqual(result.reportId, 'TR-12345');
    });

    it('should calculate future date correctly', async () => {
      const daysFromNow = 7;
      const result = await emailService.scheduleFollowUp(
        'TR-12345',
        'customer@example.com',
        daysFromNow
      );

      const scheduledDate = new Date(result.scheduledFor);
      const now = new Date();
      const diffDays = Math.round(
        (scheduledDate - now) / (1000 * 60 * 60 * 24)
      );

      assert.ok(diffDays >= 6 && diffDays <= 7); // Allow small variance
    });
  });

  describe('trackEmailOpen()', () => {
    it('should track email open', async () => {
      const trackingId = 'TRACK-123-ABC';
      const result = await emailService.trackEmailOpen(trackingId);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.trackingId, trackingId);
      assert.ok(result.openedAt);
    });
  });

  describe('trackEmailClick()', () => {
    it('should track email click', async () => {
      const trackingId = 'TRACK-123-ABC';
      const linkUrl = 'https://example.com';
      const result = await emailService.trackEmailClick(trackingId, linkUrl);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.trackingId, trackingId);
      assert.strictEqual(result.linkUrl, linkUrl);
      assert.ok(result.clickedAt);
    });
  });

  describe('wrapInLayout()', () => {
    it('should wrap content in HTML layout', () => {
      const content = '<p>Test content</p>';
      const html = emailService.wrapInLayout(content);

      assert.ok(html.includes('<!DOCTYPE html>'));
      assert.ok(html.includes('<html>'));
      assert.ok(html.includes('INT Inc.'));
      assert.ok(html.includes(content));
    });

    it('should include current year in footer', () => {
      const html = emailService.wrapInLayout('<p>Test</p>');
      const currentYear = new Date().getFullYear();
      assert.ok(html.includes(String(currentYear)));
    });
  });
});
