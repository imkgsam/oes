import { Injectable, Logger } from '@nestjs/common'
import {
  INotificationServicePort,
  NotificationRequest,
  NotificationResponse,
  NotificationTemplate
} from 'src/application/ports/notification-service.port'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { NOTIFICATION_MESSAGES } from '@oes/common/constants/messages/notification.message'
import { safeRpcCall } from '@oes/common/helpers/rpc.helper'

/**
 * Notification Service 适配器实现
 *
 * 通过 RPC 调用 Notification Service 发送验证码、安全通知等
 */
@Injectable()
export class NotificationServiceAdaptor implements INotificationServicePort {
  private readonly logger = new Logger(NotificationServiceAdaptor.name)

  constructor(
    @InjectServiceClient(ServiceKeys.NOTIFICATION_TCP)
    private readonly notificationServiceClient: any
  ) {}

  async sendEmailNotification(
    request: NotificationRequest
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(`Sending email notification: ${request.templateId}`)
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_EMAIL,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to send email notification: ${request.templateId}`,
        error
      )
      throw error
    }
  }

  async sendSmsNotification(
    request: NotificationRequest
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(`Sending SMS notification: ${request.templateId}`)
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_SMS,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to send SMS notification: ${request.templateId}`,
        error
      )
      throw error
    }
  }

  async sendPushNotification(
    request: NotificationRequest
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(`Sending push notification: ${request.templateId}`)
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_PUSH,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to send push notification: ${request.templateId}`,
        error
      )
      throw error
    }
  }

  async sendInAppNotification(
    request: NotificationRequest
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(`Sending in-app notification: ${request.templateId}`)
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_IN_APP,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to send in-app notification: ${request.templateId}`,
        error
      )
      throw error
    }
  }

  async sendVerificationEmail(
    email: string,
    code: string,
    templateId?: string
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(`Sending verification email to: ${email}`)
      const request: NotificationRequest = {
        email,
        templateId: templateId || 'verification-email',
        variables: { code, email }
      }
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_VERIFICATION_EMAIL,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to send verification email to: ${email}`, error)
      throw error
    }
  }

  async sendVerificationSms(
    phone: string,
    code: string,
    templateId?: string
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(`Sending verification SMS to: ${phone}`)
      const request: NotificationRequest = {
        phone,
        templateId: templateId || 'verification-sms',
        variables: { code, phone }
      }
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_VERIFICATION_SMS,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(`Failed to send verification SMS to: ${phone}`, error)
      throw error
    }
  }

  async sendSecurityNotification(
    userId: string,
    type: string,
    details: Record<string, any>
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(
        `Sending security notification to user: ${userId}, type: ${type}`
      )
      const request: NotificationRequest = {
        userId,
        templateId: `security-${type}`,
        variables: { ...details, userId }
      }
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_SECURITY_NOTIFICATION,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to send security notification to user: ${userId}`,
        error
      )
      throw error
    }
  }

  async sendLoginSuccessNotification(
    userId: string,
    deviceInfo: Record<string, any>,
    locationInfo?: Record<string, any>
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(`Sending login success notification to user: ${userId}`)
      const request: NotificationRequest = {
        userId,
        templateId: 'login-success',
        variables: { userId, deviceInfo, locationInfo }
      }
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_LOGIN_SUCCESS,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to send login success notification to user: ${userId}`,
        error
      )
      throw error
    }
  }

  async sendLoginFailureNotification(
    userId: string,
    deviceInfo: Record<string, any>,
    locationInfo?: Record<string, any>,
    reason?: string
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(`Sending login failure notification to user: ${userId}`)
      const request: NotificationRequest = {
        userId,
        templateId: 'login-failure',
        variables: { userId, deviceInfo, locationInfo, reason }
      }
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_LOGIN_FAILURE,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to send login failure notification to user: ${userId}`,
        error
      )
      throw error
    }
  }

  async sendRemoteLoginNotification(
    userId: string,
    deviceInfo: Record<string, any>,
    locationInfo: Record<string, any>
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(`Sending remote login notification to user: ${userId}`)
      const request: NotificationRequest = {
        userId,
        templateId: 'remote-login',
        variables: { userId, deviceInfo, locationInfo }
      }
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_REMOTE_LOGIN,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to send remote login notification to user: ${userId}`,
        error
      )
      throw error
    }
  }

  async sendAccountLockedNotification(
    userId: string,
    reason: string,
    duration?: string
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(
        `Sending account locked notification to user: ${userId}`
      )
      const request: NotificationRequest = {
        userId,
        templateId: 'account-locked',
        variables: { userId, reason, duration }
      }
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_ACCOUNT_LOCKED,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to send account locked notification to user: ${userId}`,
        error
      )
      throw error
    }
  }

  async sendPasswordResetNotification(
    userId: string,
    resetToken: string,
    expiresAt: Date
  ): Promise<NotificationResponse> {
    try {
      this.logger.debug(
        `Sending password reset notification to user: ${userId}`
      )
      const request: NotificationRequest = {
        userId,
        templateId: 'password-reset',
        variables: { userId, resetToken, expiresAt }
      }
      const response = await safeRpcCall<NotificationResponse>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.SEND_PASSWORD_RESET,
          request
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to send password reset notification to user: ${userId}`,
        error
      )
      throw error
    }
  }

  async getNotificationTemplate(
    templateId: string
  ): Promise<NotificationTemplate> {
    try {
      this.logger.debug(`Getting notification template: ${templateId}`)
      const response = await safeRpcCall<NotificationTemplate>(
        this.notificationServiceClient.send(
          NOTIFICATION_MESSAGES.GET_TEMPLATE,
          { templateId }
        )
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to get notification template: ${templateId}`,
        error
      )
      throw error
    }
  }

  async verifyNotificationSent(notificationId: string): Promise<boolean> {
    try {
      this.logger.debug(`Verifying notification sent: ${notificationId}`)
      const response = await safeRpcCall<boolean>(
        this.notificationServiceClient.send(NOTIFICATION_MESSAGES.VERIFY_SENT, {
          notificationId
        })
      )
      return response
    } catch (error) {
      this.logger.error(
        `Failed to verify notification sent: ${notificationId}`,
        error
      )
      return false
    }
  }
}
