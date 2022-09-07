import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity()
@ObjectType()
export class ChatRoom extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({ type: 'int' })
  chatRoomId!: number;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @Field()
  @Column({ type: 'boolean', default: false })
  reportHandling!: boolean;

  @Field()
  @Column({ type: 'boolean', default: false })
  sellerDelete!: boolean;
}
