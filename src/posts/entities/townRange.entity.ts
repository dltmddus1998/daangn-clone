import { Field, ObjectType } from '@nestjs/graphql';
import { Post } from 'src/posts/entities/post.entity';
import { Location } from 'src/users/entities/location.entity';
import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity()
@ObjectType()
export class TownRange extends BaseEntity {
  @Field()
  @PrimaryColumn({ type: 'int' })
  townRangeId!: number;

  @Field()
  @Column({ type: 'int' })
  townRange!: number;

  @OneToMany(type => Post, post => post.townRange, { eager: false })
  posts!: Post[];

  @OneToMany(type => Location, location => location.townRange, { eager: false })
  locations!: Location[];
}
