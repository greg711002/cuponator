import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CouponStatus {
  PENDING_CHECK = 'pending_check',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  USED = 'used',
  INVALID = 'invalid',
}

export enum CouponSource {
  ADMITAD = 'admitad',
  INTERNAL = 'internal',
}

@Entity('coupons')
@Index('idx_code', ['code'], { unique: true })
@Index('idx_expires_at', ['expires_at'])
@Index('idx_status_expires_at', ['status', 'expires_at'])
@Index('idx_source_external_id', ['source', 'external_id'], { unique: true })
export class CouponEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Уникальный код купона
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  code: string;

  /**
   * Описание купона
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  /**
   * Дисконт в процентах или абсолютном значении
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  discount_value: number;

  /**
   * Тип дисконта: 'percent' или 'fixed'
   */
  @Column({
    type: 'enum',
    enum: ['percent', 'fixed'],
    default: 'percent',
  })
  discount_type: 'percent' | 'fixed';

  /**
   * Минимальная сумма заказа для применения купона
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  min_order_value: number;

  /**
   * Максимальная скидка (cap)
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  max_discount_value: number;

  /**
   * Статус купона
   */
  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.PENDING_CHECK,
  })
  status: CouponStatus;

  /**
   * Дата истечения купона
   */
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  expires_at: Date;

  /**
   * Количество использований купона (null = неограниченно)
   */
  @Column({
    type: 'int',
    nullable: true,
  })
  usage_limit: number;

  /**
   * Текущее количество использований
   */
  @Column({
    type: 'int',
    default: 0,
  })
  usage_count: number;

  /**
   * Источник данных купона
   */
  @Column({
    type: 'enum',
    enum: CouponSource,
    default: CouponSource.INTERNAL,
  })
  source: CouponSource;

  /**
   * ID купона во внешней системе (e.g. Admitad)
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  external_id: string;

  /**
   * URL с которого пришел купон (для Admitad)
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  source_url: string;

  /**
   * Дополнительные метаданные
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any>;

  /**
   * Причина отклонения/ошибки (если статус INVALID)
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  rejection_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
