import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity()
@ObjectType()
export class BlockUser extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn({ type: 'int' })
  blockId!: number;

  @Field(type => User)
  @JoinColumn({ name: 'userPhoneNumber' })
  @ManyToOne(typee => User, user => user.user, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user!: User;

  @Field(type => User)
  @JoinColumn({ name: 'targetUserPhoneNumber' })
  @ManyToOne(typee => User, user => user.targetUser, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  targetUser!: User;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
