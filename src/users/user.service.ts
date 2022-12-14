import {
  BadRequestException,
  CacheInterceptor,
  CACHE_MANAGER,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import axios from 'axios';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import * as config from 'config';
import { SMS } from './models/sms.model';
import { JoinUserDto } from './dto/joinUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import { JwtService } from '@nestjs/jwt';
import { ProfileUserDto } from './dto/profile.dto';
import { v1 as uuid } from 'uuid';
import { MyLocationDto } from './dto/mylocation.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { EntityManager, Equal, getConnection, getRepository, IsNull, Not } from 'typeorm';
import { Location } from './entities/location.entity';
import { DeleteTownDto } from './dto/deleteTown.dto';
import { TownRange } from 'src/posts/entities/townRange.entity';
import { SearchHit } from '@elastic/elasticsearch/lib/api/types';
import * as AWS from 'aws-sdk';
import { FileUpload } from './models/fileUpload.model';
import { LocationRepository } from './repositories/location.repository';

const smsConfig: any = config.get('sms');
const ACCESS_KEY_ID = smsConfig.access_key_id;
const SECRET_KEY = smsConfig.secret_key;
const SERVICE_ID = smsConfig.service_id;
const FROM = smsConfig.from;

const s3Config: any = config.get('S3');
const AWS_S3_BUCKET_NAME = s3Config.AWS_S3_BUCKET_NAME;
const s3 = new AWS.S3({
  region: s3Config.AWS_S3_REGION,
  credentials: {
    accessKeyId: s3Config.AWS_ACCESS_KEY_ID,
    secretAccessKey: s3Config.AWS_SECRET_ACCESS_KEY,
  },
});

@Injectable()
@UseInterceptors(CacheInterceptor)
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
    @InjectRepository(LocationRepository)
    private readonly locationRepository: LocationRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly esService: ElasticsearchService,
  ) {}

  async getAroundTownList(myLocationDto: MyLocationDto): Promise<string[]> {
    /**
     * 내 위치에서 가까운 주변 동네 불러오기
     *
     * @author 허정연(golgol22)
     * @param {latitude, longitude, from, size} 위도, 경도, offset, limit
     * @return {string[]} 내 위치에서 가까운 동네부터'시도 + 시군구 + 읍면동' 형태로 반환
     * @throws {NotFoundException} 주변 지역에 대한 정보가 없을 때 예외처리
     */
    const { latitude, longitude, from, size } = myLocationDto;
    const result = await this.esService.search({
      index: 'coordinate',
      body: {
        sort: [
          {
            _geo_distance: {
              location: {
                lat: latitude,
                lon: longitude,
              },
              order: 'asc',
              unit: 'm',
            },
          },
        ],
      },
      _source: ['시도', '시군구', '읍면동'],
      from: from,
      size: size,
    });
    const aroundTownList = [];
    const hits = result.hits.hits;
    if (hits.length === 0) {
      throw new NotFoundException('검색결과가 없어요. 위치를 다시 설정해주세요!');
    }
    hits.map(item => {
      aroundTownList.push(`${item._source['시도']} ${item._source['시군구']} ${item._source['읍면동']}`);
    });
    return aroundTownList;
  }

  async getSearchTownList(area: string): Promise<string[]> {
    /**
     * 동네이름으로 동네 검색
     *
     * @author 허정연(golgol22)
     * @param {area} 검색하고 싶은 동네 이름
     * @return {string[]} 동네 이름에 검색어를 포함하는 동네 목록 '시도 + 시군구 + 읍면동' 형태로 반환
     * @throws {NotFoundException} 검색한 지역에 대한 정보가 없을 때 예외처리
     */
    const result = await this.esService.search({
      index: 'coordinate',
      body: {
        query: {
          query_string: {
            fields: ['시도', '시군구', '읍면동', '하위'],
            query: `*${area}*`,
          },
        },
      },
      _source: ['시도', '시군구', '읍면동', '하위'],
      size: 100,
    });
    const searchTownList = [];
    const hits = result.hits.hits;
    if (hits.length === 0) {
      throw new NotFoundException('검색결과가 없어요. 동네이름을 다시 확인해주세요!');
    }
    hits.map(item => {
      searchTownList.push(`${item._source['시도']} ${item._source['시군구']} ${item._source['읍면동']}`);
    });
    return searchTownList;
  }

  private async verifyExistInData(area: string) {
    /**
     * 입력한 동네가 데이터에 있는지 여부 확인
     *
     * @author 허정연(golgol22)
     * @param {area} 확인하고 싶은 동네 정보
     * @returns {siDo, siGunGu, eupMyeonDong} 동네 정보를 시도, 시군구, 읍면동으로 나누어 반환
     * @throws {BadRequestException} 동네 정보를 시도, 시군구, 읍면동으로 나눌 수 없을 때 예외처리
     * @throws {NotFoundException} 위치 데이터에서 해당 정보를 찾을 수 없을 때 예외처리
     */
    const [siDo, siGunGu, eupMyeonDong] = area.split(' ');
    if (!(siDo && siGunGu && eupMyeonDong)) {
      throw new BadRequestException('지역 형식이 올바르지 않습니다.');
    }
    const result = await this.esService.search({
      index: 'coordinate',
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  '시도.keyword': siDo,
                },
              },
              {
                match: {
                  '시군구.keyword': siGunGu,
                },
              },
              {
                match: {
                  '읍면동.keyword': eupMyeonDong,
                },
              },
            ],
          },
        },
      },
      _source: ['시도', '시군구', '읍면동'],
    });
    const hits = result.hits.hits;
    if (hits.length === 0) {
      throw new BadRequestException('없는 지역입니다. 다시 확인해주세요.');
    }
    return { siDo, siGunGu, eupMyeonDong };
  }

  async join(joinUserDto: JoinUserDto): Promise<string> {
    /**
     * 회원가입
     *
     * @author 허정연(golgol22)
     * @param {area, marketingInfoAgree, phoneNumber, isCertified} 내 동네, 마케팅 동의여부, 핸드폰 번호, sms인증확인여부
     * @return {string} access token 반환
     */
    const { area, marketingInfoAgree, phoneNumber } = joinUserDto;
    const found = await this.getUserByPhoneNumber(phoneNumber);
    if (!found) {
      const { siDo, siGunGu, eupMyeonDong } = await this.verifyExistInData(area);
      await getConnection()
        .transaction(async (manager: EntityManager) => {
          await this.userRepository.join(manager, marketingInfoAgree, phoneNumber);
          await this.locationRepository.addLocation(manager, siDo, siGunGu, eupMyeonDong, phoneNumber);
        })
        .catch(err => {
          console.error(err);
          throw new InternalServerErrorException('회원가입에 실패하였습니다. 잠시후 다시 시도해주세요.');
        });
    }
    if (found) {
      if (found.suspensionOfUse) {
        throw new ForbiddenException('이용정지된 사용자입니다. 고객센터에 문의해주세요.');
      }
    }
    const payload = { phoneNumber };
    const accessToken = this.jwtService.sign(payload);
    return accessToken;
  }

  async login(loginUserDto: LoginUserDto): Promise<string> {
    /**
     * 로그인
     *
     * @author 허정연(golgol22)
     * @param {phoneNumber, isCertified} 핸드폰번호, sms인증확인여부
     * @return {string} access token 반환
     * @throws {UnauthorizedException} 등록되지 않은 사용자에 대한 예외처리
     */
    const phoneNumber = loginUserDto.phoneNumber;
    const found = await this.getUserByPhoneNumber(phoneNumber);
    if (!found) {
      throw new UnauthorizedException('회원가입을 해주세요');
    }
    if (found.suspensionOfUse) {
      throw new ForbiddenException('이용정지된 사용자입니다. 고객센터에 문의해주세요.');
    }
    const payload = { phoneNumber };
    const accessToken = this.jwtService.sign(payload);
    return accessToken;
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User> {
    /**
     * 핸드폰 번호로 유저 조회
     *
     * @author 허정연(golgol22)
     * @param {phoneNumber} 핸드폰번호
     * @return {User} 해당하는 유저 반환
     */
    return await this.userRepository.findOne(phoneNumber);
  }

  private makeSignitureForSMS(): string {
    /**
     * sms를 보내기 위한 시그니처 생성
     *
     * @author 허정연(golgol22)
     * @return {string} signiture
     */
    const message = [];
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    const timeStamp = Date.now().toString();
    const space = ' ';
    const newLine = '\n';
    const method = 'POST';
    message.push(method);
    message.push(space);
    message.push(`/sms/v2/services/${SERVICE_ID}/messages`);
    message.push(newLine);
    message.push(timeStamp);
    message.push(newLine);
    message.push(ACCESS_KEY_ID);
    const signiture = hmac.update(message.join('')).digest('base64');
    return signiture.toString();
  }

  private makeRand6Num(): number {
    /**
     * sms에 보낼 인증번호 6자리 생성
     *
     * @author 허정연(golgol22)
     * @return {number} 인증번호 6자리
     */
    return Math.floor(Math.random() * 1000000);
  }

  async sendSMS(phoneNumber: string): Promise<string> {
    /**
     * 인증번호 메시지 보내기
     *
     * @author 허정연(golgol22)
     * @param {phoneNumber} 핸드폰번호
     * @return {string} 인증번호 반환
     * @throws {InternalServerErrorException} 인증번호 sms보내기 실패시 예외처리
     */
    await this.cacheManager.del(phoneNumber);
    const checkNumber = this.makeRand6Num().toString().padStart(6, '0');
    const body: SMS = {
      type: 'SMS',
      contentType: 'COMM',
      countryCode: '82',
      from: FROM,
      content: `인증번호는 [${checkNumber}] 입니다.`,
      messages: [
        {
          to: phoneNumber,
        },
      ],
    };
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-apigw-timestamp': Date.now().toString(),
      'x-ncp-iam-access-key': ACCESS_KEY_ID,
      'x-ncp-apigw-signature-v2': this.makeSignitureForSMS(),
    };
    try {
      const result = await axios.post(`https://sens.apigw.ntruss.com/sms/v2/services/${SERVICE_ID}/messages`, body, { headers });
      if (result.status === 202) {
        await this.cacheManager.set(phoneNumber, checkNumber);
        return checkNumber;
      }
    } catch (err) {
      console.error(err.response.data);
      throw new InternalServerErrorException('인증 메시지를 보내는데 실패하였습니다.');
    }
  }

  async checkSMS(phoneNumber: string, inputNumber: string): Promise<string> {
    /**
     * 인증번호 확인
     *
     * @author 허정연(golgol22)
     * @param {phoneNumber, inputNumber} 핸드폰번호, 사용자가 입력한 인증번호
     * @return {string} 인증번호 확인 유무 메시지
     */
    const storedNumber = (await this.cacheManager.get(phoneNumber)) as string;
    if (storedNumber === inputNumber) return '인증이 완료되었습니다.';
    return '인증번호가 올바르지않습니다.';
  }

  async setProfile(phoneNumber: string, profileUserDto: ProfileUserDto): Promise<User> {
    /**
     * 유저 프로필 설정
     *
     * @author 허정연(golgol22)
     * @param {phoneNumber, userName, profileImage} 핸드폰번호, 사용자 이름, 프로필 이미지
     * @return {User} 유저 반환
     * @throws {ConflictException} 이미 사용중인 사용자이름일 때 예외처리
     * @throws {BadRequestException} 회원가입 후 첫 사용자 이름 설정인 경우 반드시 이름을 설정해야한다는 예외처리
     * @throws {InternalServerErrorException} 프로필 수정 실패할 때 예외처리
     */
    const { userName, profileImage } = profileUserDto;
    if (userName) {
      const found = await this.userRepository.findOne({ where: { userName } });
      if (found) {
        throw new ConflictException(`${userName}은 이미 사용중인 이름입니다.`);
      }
    }
    const user = await this.userRepository.findOne(phoneNumber);
    if (user.userName === null) {
      throw new BadRequestException(`처음 이름은 꼭 설정해야 합니다.`);
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        if (userName) {
          await this.userRepository.setProfileUserName(manager, phoneNumber, userName);
        }
        if (profileImage) {
          await this.imageDeleteFromS3(user.profileImage);
          await this.imageUploadToS3(manager, user.phoneNumber, profileImage);
        }
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('유저 프로필 설정에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.getUserByPhoneNumber(phoneNumber);
  }

  async imageUploadToS3(manager: EntityManager, phoneNumber: string, profileImage: Promise<FileUpload>) {
    /**
     * S3에 프로필 이미지 저장
     *
     * @author 허정연(golgol22)
     * @param {phoneNumber, profileImage} 프로필 이미지 설정할 유저, 업로드할 프로필 이미지
     */
    const { encoding, mimetype, createReadStream } = await profileImage;
    try {
      const newFileName = uuid();
      await s3
        .putObject({
          Key: `${newFileName}.png`,
          Body: createReadStream(),
          Bucket: `${AWS_S3_BUCKET_NAME}/profile`,
          ContentEncoding: encoding,
          ContentType: mimetype,
          ContentLength: createReadStream().readableLength,
        })
        .promise();
      await this.userRepository.setProfileImage(manager, phoneNumber, `${newFileName}.png`);
    } catch (err) {
      console.error(err);
    }
  }

  private async imageDeleteFromS3(profileImage: string) {
    /**
     * S3에서 프로필 이미지 삭제
     *
     * @author 허정연(golgol22)
     * @param {profileImage} 삭제할 프로필 이미지명
     */
    try {
      await s3
        .deleteObject({
          Key: profileImage,
          Bucket: `${AWS_S3_BUCKET_NAME}/profile`,
        })
        .promise();
    } catch (err) {
      console.error(err);
    }
  }

  async getMyTownList(user: User): Promise<Location[]> {
    /**
     * 유저가 설정한 동네 목록 반환
     *
     * @author 허정연(golgol22)
     * @param {user} 로그인한 유저
     * @return {Location[]} 저장된 위치 정보 반환
     */
    return await this.locationRepository.find({ where: { user: user.phoneNumber, deletedAt: IsNull() } });
  }

  async updateTownSelection(user: User, eupMyeonDong: string): Promise<Location[]> {
    /**
     * 선택된 동네 수정
     *
     * @author 허정연(golgol22)
     * @param {user, eupMyeonDong} 로그인한 유저, 변경한 읍면동 이름
     * @return {Location[]} 저장된 위치 정보 반환
     * @throws {BadRequestException} 이미 선택된 동네일 경우 예외처리
     * @throws {InternalServerErrorException} 동네 선택 수정에 실패할 때 예외처리
     */
    const location = await this.locationRepository.findOne({ where: { user: user.phoneNumber, eupMyeonDong: eupMyeonDong } });
    if (location.isSelected) {
      throw new BadRequestException('이미 선택된 동네입니다.');
    }
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        location.isSelected = true;
        await manager.save(location);
        const location2 = await this.locationRepository.findOne({ where: { user: user.phoneNumber, eupMyeonDong: Not(Equal(eupMyeonDong)) } });
        location2.isSelected = false;
        await manager.save(location2);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('동네 선택 수정에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.getMyTownList(user);
  }

  async addTown(user: User, area: string): Promise<Location[]> {
    /**
     * 동네 추가
     * 이미 추가되었지만 삭제된 경우 복원하고, 추가된 적 없을 경우 새로 추가
     *
     * @author 허정연(golgol22)
     * @param {user, area} 로그인한 유저, 추가할 동네 정보
     * @return {Location[]} 저장된 위치 정보 반환
     * @throws {BadRequestException} 2개 넘게 동네를 저장하려고 할 때 예외처리
     * @throws {ConflictException} 추가하려는 동네가 이미 추가된 동네일 때 예외처리
     * @throws {InternalServerErrorException} 동네 추가에 실패할 때 예외처리
     */
    const { siDo, siGunGu, eupMyeonDong } = await this.verifyExistInData(area);
    const count = await this.locationRepository.count({ where: { user: user.phoneNumber, deletedAt: IsNull() } });
    if (count === 2) {
      throw new BadRequestException('동네는 2개까지 등록이 가능합니다.');
    }
    const location = await this.locationRepository.findOne({ where: { user: user.phoneNumber, eupMyeonDong: eupMyeonDong } });
    if (location) {
      if (location.deletedAt === null) {
        throw new ConflictException('이미 추가된 동네입니다.');
      }
      // 이미 추가되었지만 삭제된 경우 복원
      await getConnection()
        .transaction(async (manager: EntityManager) => {
          location.isSelected = true;
          location.deletedAt = null;
          await manager.save(location);
          const location2 = await this.locationRepository.findOne({ where: { user: user.phoneNumber, eupMyeonDong: Not(Equal(eupMyeonDong)), deletedAt: IsNull() } });
          location2.isSelected = false;
          await manager.save(location2);
        })
        .catch(err => {
          console.error(err);
          throw new InternalServerErrorException('동네 추가에 실패하였습니다. 잠시후 다시 시도해주세요.');
        });
      return await this.getMyTownList(user);
    }
    // 추가된 적 없을 경우 새로 추가
    await getConnection()
      .transaction(async (manager: EntityManager) => {
        await this.locationRepository.addLocation(manager, siDo, siGunGu, eupMyeonDong, user.phoneNumber);
        const location2 = await this.locationRepository.findOne({ where: { user: user.phoneNumber, eupMyeonDong: Not(Equal(eupMyeonDong)), deletedAt: IsNull() } });
        location2.isSelected = false;
        await manager.save(location2);
      })
      .catch(err => {
        console.error(err);
        throw new InternalServerErrorException('동네 추가에 실패하였습니다. 잠시후 다시 시도해주세요.');
      });
    return await this.getMyTownList(user);
  }

  async deleteTown(user: User, deleteTownDto: DeleteTownDto): Promise<Location[]> {
    /**
     * 동네 삭제
     * 기존 동네가 1개인 경우 추가를 해야 삭제가 가능하도록 구현
     * deleteAt를 현재 남짜로 수정 (위치를 삭제해도 게시글의 위치 정보를 남겨두는데 softDelete는 삭제된 정보를 조회할 수 없기 때문에 softDelete를 사용하지 않음)
     * 동네 인증이 되지 않은 지역은 삭제, 인증이 된 지역은  deletedAt 상태 변경
     *
     * @author 허정연(golgol22)
     * @param {user, deleteDupMyeonDong, addArea} 로그인한 유저, 삭제할 읍변동 정보, 추가할 동네 정보
     * @return {Location[]} 저장된 위치 정보 반환
     * @throws {NotFoundException} 등록된 적 없는 동네를 삭제하려고 할 때 예외처리
     * @throws {BadRequestException} 삭제하려는 동네가 이미 삭제 처리된 동네일 때 예외처리
     * @throws {BadRequestException} 1개 저장된 동네를 삭제하려고 하는데 추가할 동네정보를 입력하지 않았을 때 예외처리
     * @throws {ConflictException} 추가하려는 동네가 이미 추가된 동네일 때 예외처리
     * @throws {InternalServerErrorException} 동네 삭제에 실패할 때 예외처리
     */
    const { deleteDupMyeonDong, addArea } = deleteTownDto;
    const locations = await this.locationRepository.find({ where: { user: user.phoneNumber } });
    const exist = locations.filter(location => location.eupMyeonDong === deleteDupMyeonDong);
    if (exist.length === 0) {
      throw new NotFoundException('등록된 적 없는 동네입니다.');
    }
    locations.filter(location => {
      if (location.deletedAt !== null && location.eupMyeonDong === deleteDupMyeonDong) throw new BadRequestException('이미 삭제된 동네입니다.');
    });
    const notDeleted = locations.filter(location => location.deletedAt === null);
    if (notDeleted.length === 1) {
      if (!addArea) {
        throw new BadRequestException('동네는 1개이상 등록해야 합니다.');
      }
      const { siDo, siGunGu, eupMyeonDong } = await this.verifyExistInData(addArea);
      locations.map(location => {
        if (location.eupMyeonDong === eupMyeonDong && location.deletedAt === null) throw new ConflictException('이미 추가된 동네입니다.');
      });
      await getConnection()
        .transaction(async (manager: EntityManager) => {
          const deleted = locations.filter(location => location.eupMyeonDong === eupMyeonDong);
          if (deleted.length === 0) {
            await this.locationRepository.addLocation(manager, siDo, siGunGu, eupMyeonDong, user.phoneNumber);
          } else {
            deleted[0].isSelected = true;
            deleted[0].deletedAt = null;
            await manager.save(deleted[0]);
          }

          const deleteLocation = await this.locationRepository.findOne({ where: { user: user.phoneNumber, eupMyeonDong: deleteDupMyeonDong } });
          if (deleteLocation.isConfirmedPosition) {
            deleteLocation.isSelected = false;
            deleteLocation.deletedAt = new Date();
            await manager.save(deleteLocation);
          } else {
            await manager.delete(Location, deleteLocation);
          }
        })
        .catch(err => {
          console.error(err);
          throw new InternalServerErrorException('동네 삭제에 실패하였습니다. 잠시후 다시 시도해주세요.');
        });
    } else {
      await getConnection()
        .transaction(async (manager: EntityManager) => {
          const location2 = await this.locationRepository.findOne({ where: { user: user.phoneNumber, eupMyeonDong: Not(Equal(deleteDupMyeonDong)), deletedAt: IsNull() } });
          location2.isSelected = true;
          await manager.save(location2);

          const deleteLocation = await this.locationRepository.findOne({ where: { user: user.phoneNumber, eupMyeonDong: deleteDupMyeonDong } });
          if (deleteLocation.isConfirmedPosition) {
            deleteLocation.isSelected = false;
            deleteLocation.deletedAt = new Date();
            await manager.save(deleteLocation);
          } else {
            await manager.delete(Location, { locationId: deleteLocation.locationId });
          }
        })
        .catch(err => {
          console.error(err);
          throw new InternalServerErrorException('동네 삭제에 실패하였습니다. 잠시후 다시 시도해주세요.');
        });
    }
    return await this.getMyTownList(user);
  }

  async setTownCertification(user: User, myLocationDto: MyLocationDto): Promise<string> {
    /**
     * 동네 인증
     * 선택되어있는 동네와 요청받은 위치 좌표가 같은 동네이면 인증
     *
     * @author 허정연(golgol22)
     * @param {user, latitude, longitude, from, size} 로그인한 유저, 위도, 경도, offset, limit
     * @return {Location[]} 저장된 위치 정보 반환
     * @throws {BadRequestException} 이미 인증한 동네인 경우
     * @throws {NotFoundException} 주변 지역에 대한 정보가 없을 때 예외처리
     * @throws {InternalServerErrorException} 동네인증에 실패했을 때 예외처리
     */
    const location = await this.locationRepository.findOne({ where: { user: user.phoneNumber, isSelected: true } });
    if (location.isConfirmedPosition) {
      throw new BadRequestException('이미 인증된 동네입니다.');
    }
    myLocationDto.from = 0;
    myLocationDto.size = 5;
    const aroundTownList = await this.getAroundTownList(myLocationDto);
    const exist = aroundTownList.filter(town => {
      return town.split(' ')[2] === location.eupMyeonDong;
    });
    if (exist) {
      location.isConfirmedPosition = true;
      await this.locationRepository.save(location);
      return `${location.eupMyeonDong} 인증되었습니다.`;
    }
    return `${location.eupMyeonDong} 인증에 실패하였습니다.`;
  }

  async setTownRange(user: User, townRange: number): Promise<string> {
    /**
     * 동네 범위 변경
     * 선택되어있는 동네의 동네 범위 변경
     *
     * @author 허정연(golgol22)
     * @param {user, townRange} 로그인한 유저, 지정할 동네 범위
     * @return {string} 설정되었다는 문구
     * @throws {BadRequestException} 이미 설정된 동네 범위를 설정하하려고 할 때 예외처리
     * @throws {NotFoundException} 없는 동네 범위를 설정하려고 할 때 예외 처리
     */
    const location = await this.locationRepository.findOne({ where: { user: user.phoneNumber, isSelected: true } });
    if (location.townRange.townRangeId === townRange) {
      throw new BadRequestException('이미 설정된 동네 범위입니다.');
    }
    const possibleTownRange = await getRepository(TownRange).find();
    const exist = possibleTownRange.filter(town => {
      return town.townRangeId === townRange;
    });
    if (exist.length == 0) {
      throw new NotFoundException('지정할 수 없는 값입니다.');
    }
    location.townRange.townRangeId = townRange;
    await this.locationRepository.save(location);
    return `동네 범위가 ${townRange}으로 변경되었습니다.`;
  }

  private async townRangeEqual1(location: Location) {
    /**
     * 동네 범위가 1일 때 동네 목록 조회
     * 동네 범위가 1일때는 같은 동만 조회가능 (ex. 논현1동 -> 논현동, 논현1동, 논현2동)
     *
     * @author 허정연(golgol22)
     * @param {location} 위치 정보
     * @return {SearchHit[]} 해당하는 동 목록
     */
    const commonEupMyeonDong = location.eupMyeonDong.replace(/[0-9]/g, '').replace('동', '');
    const eupMyeonDong = await this.esService.search({
      index: 'coordinate',
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  '시도.keyword': location.siDo,
                },
              },
              {
                match: {
                  '시군구.keyword': location.siGunGu,
                },
              },
              {
                query_string: {
                  default_field: '읍면동',
                  query: `${commonEupMyeonDong}*`,
                },
              },
            ],
          },
        },
      },
      _source: ['읍면동'],
    });
    return eupMyeonDong.hits.hits;
  }

  private async getCoordinateByTown(location: Location) {
    /**
     * DB에 저장된 위치 정보에 대한 위도, 경도 좌표값
     *
     * @author 허정연(golgol22)
     * @param {location} 위치 정보
     * @return {SearchHit[]} 좌표값
     * @throws {InternalServerErrorException} 데이터가 없는 지역에 대한 예외 처리
     * (Location데이터를 추가할 때 데이터가 존재하는지 확인하고 추가하기 때문에 해당 에러가 나올 경우가 없지만, 위치 데이터가 변경되었을 경우 에러가 생길 수 있어서 예최처리)
     */
    const coordinate = await this.esService.search({
      index: 'coordinate',
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  '시도.keyword': location.siDo,
                },
              },
              {
                match: {
                  '시군구.keyword': location.siGunGu,
                },
              },
              {
                match: {
                  '읍면동.keyword': location.eupMyeonDong,
                },
              },
            ],
          },
        },
      },
      _source: ['위도', '경도'],
      size: 1,
    });
    const coordinateHits = coordinate.hits.hits;
    if (coordinateHits.length === 0) {
      throw new InternalServerErrorException('지역이 잘못되었습니다. 관리자에게 문의해주세요.');
    }
    return coordinateHits;
  }

  async getTownListByCoordinate(townRange: number, coordinate: SearchHit[]) {
    /**
     * 좌표에서 설정된 동네 범위안에 있는 동 목록 조회
     *
     * @author 허정연(golgol22)
     * @param {location, coordinate} 위치 정보, 좌표 정보
     * @return {SearchHit[]} 동 목록
     */
    const townListByCoordinate = await this.esService.search({
      index: 'coordinate',
      body: {
        query: {
          bool: {
            must: {
              match_all: {},
            },
            filter: {
              geo_distance: {
                distance: `${townRange}km`,
                location: {
                  lat: coordinate[0]._source['위도'],
                  lon: coordinate[0]._source['경도'],
                },
              },
            },
          },
        },
      },
      _source: ['읍면동'],
      size: 10000,
    });
    return townListByCoordinate.hits.hits;
  }

  async getTownCountByTownRange(user: User, location: Location, townRange: number): Promise<number> {
    /**
     * 동네 범위에 따른 동네 개수
     * 동네와 동네 범위에 따른 동네 개수
     *
     * @author 허정연(golgol22)
     * @param {user, townRange} 로그인한 유저, 동네 범위
     * @return {number} 동네 개수
     * @throws {NotFoundException} 없는 동네 범위를 설정하려고 할 때 예외 처리
     */
    const possibleTownRange = await getRepository(TownRange).find();
    const exist = possibleTownRange.filter(town => {
      return town.townRangeId === townRange;
    });
    if (exist.length === 0) {
      throw new NotFoundException('확인할 수 없는 동네 범위입니다.');
    }
    if (townRange === 1) {
      const townRangeEqual1 = await this.townRangeEqual1(location);
      return townRangeEqual1.length;
    }
    const coordinate = await this.getCoordinateByTown(location);
    const townListByCoordinate = await this.getTownListByCoordinate(townRange, coordinate);
    return townListByCoordinate.length;
  }

  async getTownListByTownRange(user: User, location: Location, townRange: number): Promise<string[]> {
    /**
     * 동네 범위에 따른 동네 목록
     * 동네와 동네 범위애 따른 동네 목록
     *
     * @author 허정연(golgol22)
     * @param {user, townRange} 로그인한 유저, 동네 범위
     * @return {string[]} 동네 목록
     * @throws {NotFoundException} 없는 동네 범위를 설정하려고 할 때 예외 처리
     */
    const possibleTownRange = await getRepository(TownRange).find();
    const exist = possibleTownRange.filter(town => {
      return town.townRangeId === townRange;
    });
    if (exist.length === 0) {
      throw new NotFoundException('확인할 수 없는 동네 범위입니다.');
    }
    const result = [];
    if (townRange === 1) {
      const townRangeEqual1 = await this.townRangeEqual1(location);
      townRangeEqual1.map(item => {
        result.push(item._source['읍면동']);
      });
      return result;
    }
    const coordinate = await this.getCoordinateByTown(location);
    const townListByCoordinate = await this.getTownListByCoordinate(townRange, coordinate);
    townListByCoordinate.map(item => {
      result.push(item._source['읍면동']);
    });
    return result;
  }
}
