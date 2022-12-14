import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TownRange } from 'src/posts/entities/townRange.entity';
import { User } from './user.entity';
import { Post } from 'src/posts/entities/post.entity';

@Entity()
@ObjectType()
export class Location extends BaseEntity {
  @Field(() => Number)
  @PrimaryGeneratedColumn({ type: 'int' })
  locationId!: number;

  @Field()
  @Column({ type: 'varchar', length: 30 })
  siDo!: string;

  @Field()
  @Column({ type: 'varchar', length: 30 })
  siGunGu!: string;

  @Field()
  @Column({ type: 'varchar', length: 30 })
  eupMyeonDong!: string;

  @Field()
  @Column({ type: 'boolean', default: false })
  isConfirmedPosition!: boolean;

  @Field()
  @Column({ type: 'boolean', default: true })
  isSelected!: boolean;

  @Field()
  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @Field({ nullable: true })
  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date;

  @Field(() => User)
  @JoinColumn({ name: 'phoneNumber' })
  @ManyToOne(type => User, user => user.locations, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user!: string;

  @Field(() => TownRange)
  @JoinColumn({ name: 'townRange' })
  @Column({ type: 'int', default: 2 })
  @ManyToOne(type => TownRange, townRange => townRange.locations, { eager: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  townRange!: TownRange;

  @OneToMany(type => Post, post => post.location, { eager: false })
  posts: Post[];
}
