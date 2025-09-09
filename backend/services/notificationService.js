import Notification from '../models/Notification.js';

class NotificationService {
  // Create a new notification
  static async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      return notification;
    } catch (error) {
      throw error;
    }
  }

  // Create pothole status update notification
  static async createPotholeStatusNotification(userId, potholeId, oldStatus, newStatus, locationName) {
    const statusMessages = {
      'acknowledged': 'Your pothole report has been acknowledged by authorities',
      'in_progress': 'Work has started on your reported pothole',
      'resolved': 'Your reported pothole has been fixed!'
    };

    const message = statusMessages[newStatus];
    if (!message) return null;

    return await this.createNotification({
      user: userId,
      type: 'pothole_status',
      title: `Pothole Status Updated`,
      message: `${message} at ${locationName}`,
      relatedId: potholeId,
      relatedModel: 'Pothole',
      actionUrl: `/my-reports`,
      priority: newStatus === 'resolved' ? 'high' : 'medium'
    });
  }

  // Create feedback response notification
  static async createFeedbackResponseNotification(userId, feedbackId, responseMessage) {
    return await this.createNotification({
      user: userId,
      type: 'feedback_response',
      title: 'Feedback Response',
      message: `We've responded to your feedback: "${responseMessage.substring(0, 100)}${responseMessage.length > 100 ? '...' : ''}"`,
      relatedId: feedbackId,
      relatedModel: 'Feedback',
      actionUrl: `/profile`,
      priority: 'medium'
    });
  }

  // Create bug report response notification
  static async createBugReportResponseNotification(userId, bugReportId, responseMessage) {
    return await this.createNotification({
      user: userId,
      type: 'bug_response',
      title: 'Bug Report Update',
      message: `We've responded to your bug report: "${responseMessage.substring(0, 100)}${responseMessage.length > 100 ? '...' : ''}"`,
      relatedId: bugReportId,
      relatedModel: 'BugReport',
      actionUrl: `/profile`,
      priority: 'medium'
    });
  }

  // Create bug report status update notification
  static async createBugReportStatusNotification(userId, bugReportId, oldStatus, newStatus, title) {
    const statusMessages = {
      'pending': 'Your bug report is pending review',
      'in_progress': 'We are working on your bug report',
      'resolved': 'Your bug report has been resolved!',
      'closed': 'Your bug report has been closed'
    };

    const message = statusMessages[newStatus];
    if (!message) return null;

    return await this.createNotification({
      user: userId,
      type: 'bug_response',
      title: `Bug Report Status Updated`,
      message: `${message}: "${title}"`,
      relatedId: bugReportId,
      relatedModel: 'BugReport',
      actionUrl: `/profile`,
      priority: newStatus === 'resolved' ? 'high' : 'medium'
    });
  }

  // Create feedback status update notification
  static async createFeedbackStatusNotification(userId, feedbackId, oldStatus, newStatus, message) {
    const statusMessages = {
      'pending': 'Your feedback is pending review',
      'reviewed': 'Your feedback has been reviewed',
      'actioned': 'We are taking action on your feedback',
      'closed': 'Your feedback has been closed'
    };

    const statusMessage = statusMessages[newStatus];
    if (!statusMessage) return null;

    return await this.createNotification({
      user: userId,
      type: 'feedback_response',
      title: `Feedback Status Updated`,
      message: `${statusMessage}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
      relatedId: feedbackId,
      relatedModel: 'Feedback',
      actionUrl: `/profile`,
      priority: newStatus === 'actioned' ? 'high' : 'medium'
    });
  }

  // Create system announcement notification
  static async createSystemAnnouncement(userIds, title, message, priority = 'medium') {
    const notifications = userIds.map(userId => ({
      user: userId,
      type: 'system_announcement',
      title,
      message,
      priority
    }));

    return await Notification.insertMany(notifications);
  }

  // Create area update notification (new potholes in user's area)
  static async createAreaUpdateNotification(userId, potholeId, locationName) {
    return await this.createNotification({
      user: userId,
      type: 'area_update',
      title: 'New Pothole in Your Area',
      message: `A new pothole has been reported at ${locationName}`,
      relatedId: potholeId,
      relatedModel: 'Pothole',
      actionUrl: `/gallery`,
      priority: 'low'
    });
  }

  // Get unread notification count for a user
  static async getUnreadCount(userId) {
    return await Notification.countDocuments({
      user: userId,
      isRead: false
    });
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    return await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
  }

  // Delete old notifications (cleanup)
  static async cleanupOldNotifications(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });
  }
}

export default NotificationService; 