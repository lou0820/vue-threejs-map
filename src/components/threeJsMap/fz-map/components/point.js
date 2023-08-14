import * as THREE from 'three'
import {Component} from '@/libs/mini3d'
import pointSvg from '@/assets/imgs/point.svg'

export class Points extends Component {
    constructor(base, config = {}) {
        super(base);
        const pointTexture = new THREE.TextureLoader().load(pointSvg);
        this.config = Object.assign(
            {
                outSprite: new THREE.SpriteMaterial({
                    map: pointTexture,
                    sizeAttenuation: false,
                }),
                innerSprite: new THREE.SpriteMaterial({
                    map: pointTexture,
                    sizeAttenuation: false,
                    depthTest: false,
                    opacity: 0.2,
                })
            },
            config,
        )
    }
    create(x, y, companyId, adCode){
        // 第一个精灵图模型
        let sprite1 = new THREE.Sprite(this.config.outSprite);
        // 第二个精灵图模型
        let sprite2 = new THREE.Sprite(this.config.innerSprite);
        // 第一个精灵图模型 把 第二个精灵图模型 添加为子模型
        sprite1.add(sprite2);
        // 设置精灵图模型的尺寸缩放
        sprite1.scale.set(0.03, 0.03, 0);
        // 设置精灵图模型初始位置
        sprite1.position.set(x, y, 1);
        sprite1.name = companyId + "-" + adCode;
        // 因为场景里不可能只有标点，所以要对精灵图模型添加特异性字段进行区分
        sprite1.isMarker = true;
        // 把第一个精灵图模型添加到场景
        this.base.scene.add(sprite1);
        // 把标点（第一个精灵图模型）添加到objArr

        return sprite1;
    }
}
