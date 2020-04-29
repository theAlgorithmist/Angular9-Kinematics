/**
 * Copyright 2020 Jim Armstrong (https://www.linkedin.com/in/jimarmstrong/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * This software was derived from that containing the following copyright notice
 *
 * copyright (c) 2006, Jim Armstrong.  All Rights Reserved.
 *
 * This software program is supplied 'as is' without any warranty, express, implied,
 * or otherwise, including without limitation all warranties of merchantability or fitness
 * for a particular purpose.  Jim Armstrong shall not be liable for any special incidental, or
 * consequential damages, including, without limitation, lost revenues, lost profits, or
 * loss of prospective economic advantage, resulting from the use or misuse of this software
 * program.
 */

/**
 * Humanoid Biped Rig.  Current implementation is for symmetric characters and the Biped is linked to PIXI JS for
 * Canvas rendering.  The current architecture has a fixed set of limbs/connectors, which may be relaxed in the
 * future.
 * 
 * @author Jim Armstrong
 * 
 * @version 1.0
 */

import { BoneModel    } from '../../interfaces/bone-model';
import { Arm          } from './arm';
import { Clavicle     } from './clavicle';
import { Foot         } from './foot';
import { Head         } from './head';
import { IChain       } from '../../interfaces/chain-model';
import { Neck         } from './neck';
import { Pelvis       } from './pelvis';
import { SimpleSpine  } from './simple-spine';
import { Hand         } from './hand';
import { Leg          } from './leg';
import { BoneTemplate } from './bone-template';
import { Connector    } from './connector';
import { Linkable     } from '../../interfaces/linkable';

import { IGraphics } from '../../interfaces/graphics';
import { ColorEnum } from '../../interfaces/colors';
import { BONE_PROPS } from '../../interfaces/bone-properties';

import * as PIXI from 'pixi.js/dist/pixi.js';

export class Biped
{
  // limbs
  public static readonly HEAD: string            = "H";
  public static readonly NECK: string            = "N";
  public static readonly PELVIS: string          = "P";
  public static readonly SPINE: string           = "S";
  public static readonly LEFT_CLAVICLE: string   = "LC";
  public static readonly LEFT_UPPER_ARM: string  = "LUA";
  public static readonly LEFT_FOREARM: string    = "LF";
  public static readonly LEFT_HAND: string       = "LH";
  public static readonly LEFT_UPPER_LEG: string  = "LUL";
  public static readonly LEFT_LOWER_LEG: string  = "LLL";
  public static readonly LEFT_FOOT: string       = "LF";
  public static readonly RIGHT_CLAVICLE: string  = "LC";
  public static readonly RIGHT_UPPER_ARM: string = "LUA";
  public static readonly RIGHT_FOREARM: string   = "LF";
  public static readonly RIGHT_HAND: string      = "LH";
  public static readonly RIGHT_UPPER_LEG: string = "LUL";
  public static readonly RIGHT_LOWER_LEG: string = "LLL";
  public static readonly RIGHT_FOOT: string      = "LF";

  // bounding-box fractions
  public static readonly COM_Y: number    = 0.525;
  public static readonly HEAD_X: number   = 0.153;
  public static readonly HEAD_Y: number   = 0.153;
  public static readonly NECK_X: number   = 0.05;
  public static readonly NECK_Y: number   = 0.053;
  public static readonly CLAV_X: number   = 0.2222;
  public static readonly CLAV_Y: number   = 0.0231;
  public static readonly ARM_X: number    = 0.198;
  public static readonly ARM_Y: number    = 0.3025;
  public static readonly PELVIS_X: number = 0.298;
  public static readonly PELVIS_Y: number = 0.095;
  public static readonly LEG_X: number    = 0.1;
  public static readonly LEG_Y: number    = 0.521;
  public static readonly SPINE_X: number  = 0.435;
  public static readonly SPINE_Y: number  = 0.2725;
  
  // properties
  public NAME: string;                  // name associated with this Biped
  public ID: number;                    // numeric ID associated with this Biped

  protected _bipedContainer: PIXI.Container;
  
  // COM
  protected _COM: PIXI.Graphics;        // Center-of-Mass (visual representation)
  protected _comX: number;              // COM x-coordinate
  protected _comY: number;              // COM y-coordinate
  protected _angle: number;             // Biped orientation relative to pos. x-axis

  // All Chains and connectors linked to the COM - including those outside the Biped (allows for chains outside the normal limb set)
  protected _links: Array<Linkable>;

  protected _linkedTo: Linkable;        // what is the COM linked to?
  protected _numLinks: number;          // total number of direct links to the COM
  protected _head: Head;                // Biped head
  protected _neck: Neck;                // Biped neck
  protected _leftClavicle: Clavicle;    // Biped left clavicle
  protected _leftArm: Arm;              // Biped left arm
  protected _leftHand: Hand;            // Biped left hand
  protected _leftLeg: Leg;              // Biped left leg
  protected _leftFoot: Foot;            // Biped left foot
  protected _spine: SimpleSpine;        // Biped spine
  protected _rightClavicle: Clavicle;   // Biped right clavicle
  protected _rightArm: Arm;             // Biped right arm
  protected _rightHand: Hand;           // Biped right hand
  protected _rightLeg: Leg;             // Biped right leg
  protected _rightFoot: Foot;           // Biped right foot
  protected _pelvis: Pelvis;            // Biped pelvis 
  protected _selected: Object;          // reference to current selection
  protected _comSelected: boolean;      // true if the COM is selected
  protected _limbs:Record<string, any>; // hash of all Biped limbs, indexed by symbolic name
  protected _mouseEvent: string;        // most recent type of mouse interaction

  // drawing templates - also used for skinning of segmented characters
  protected _headTemplate: BoneTemplate;
  protected _neckTemplate: BoneTemplate;
  protected _clavicleTemplate: BoneTemplate;
  protected _upperArmTemplate: BoneTemplate;
  protected _foreArmTemplate: BoneTemplate;
  protected _handTemplate: BoneTemplate;
  protected _upperLegTemplate: BoneTemplate;
  protected _lowerLegTemplate: BoneTemplate;
  protected _footTemplate: BoneTemplate;
  protected _spineTemplate: BoneTemplate;
  protected _pelvisTemplate: BoneTemplate;

  // Low-level notification of events
  protected _notify:Function;
  
  // A rig is constructed from a bounding-box
  constructor(c: PIXI.Container, x: number, y: number, w: number, h: number)
  {
    this.NAME         = "Biped";
    this.ID           = 0;
    this._COM         = c;
    this._angle       = Clavicle.PI_2;
    this._numLinks    = 0;
    this._selected    = null;
    this._notify      = null;
    this._limbs       = {};
    this._links       = new Array<any>();
    this._comSelected = false;

    this._linkedTo      = null;
    this._head          = null;
    this._neck          = null;
    this._leftArm       = null;
    this._leftArm       = null;
    this._leftHand      = null;
    this._leftLeg       = null;
    this._leftFoot      = null;
    this._spine         = null;
    this._rightClavicle = null;
    this._rightArm      = null;
    this._rightHand     = null;
    this._rightLeg      = null;
    this._rightFoot     = null;
    this._pelvis        = null;

    this._mouseEvent = BONE_PROPS.BONE_NONE;

    this._links = new Array<IChain>();
    
    this._bipedContainer = c;

    // Default Templates (arm and leg chains have their own default Templates, so these won't be changed unless overriden by the caller)

    // Foot Template
    this._footTemplate = new BoneTemplate();
    this._footTemplate.insert(0,15);
    this._footTemplate.insert(25,50);
    this._footTemplate.insert(100,50);

    // Hand Template
    this._handTemplate = new BoneTemplate();
    this._handTemplate.insert(0,20);
    this._handTemplate.insert(25,50);
    this._handTemplate.insert(85,60);
    this._handTemplate.insert(100,35);

    // Head Template
    this._headTemplate = new BoneTemplate();
    this._headTemplate.insert(0,40);
    this._headTemplate.insert(25,60);
    this._headTemplate.insert(85,60);
    this._headTemplate.insert(100,45);

    // Spine Template
    this._spineTemplate = new BoneTemplate();
    this._spineTemplate.insert(0,15);
    this._spineTemplate.insert(20,25);
    this._spineTemplate.insert(75,35);
    this._spineTemplate.insert(85,35);
    this._spineTemplate.insert(95,28);
    this._spineTemplate.insert(100,22);

    // Clavicle Template
    this._clavicleTemplate = new BoneTemplate();
    this._clavicleTemplate.insert(0,3);
    this._clavicleTemplate.insert(5,3);
    this._clavicleTemplate.insert(20,5);
    this._clavicleTemplate.insert(85,5);
    this._clavicleTemplate.insert(90,8);
    this._clavicleTemplate.insert(95,8);
    this._clavicleTemplate.insert(100,5);

    // Pelvis Template
    this._pelvisTemplate= new BoneTemplate();
    this._pelvisTemplate.insert(0,100);
    this._pelvisTemplate.insert(35,100);
    this._pelvisTemplate.insert(100,40);

    // Neck Template
    this._neckTemplate = new BoneTemplate();
    this._neckTemplate.insert(0,50);
    this._neckTemplate.insert(100,50);

    // arm templates
    this._upperArmTemplate = new BoneTemplate();
    this._upperArmTemplate.insert(0,5);
    this._upperArmTemplate.insert(10,8);
    this._upperArmTemplate.insert(90,8);
    this._upperArmTemplate.insert(96,5);

    this._foreArmTemplate = new BoneTemplate();
    this._foreArmTemplate.insert(0,3);
    this._foreArmTemplate.insert(10,6);
    this._foreArmTemplate.insert(90,6);
    this._foreArmTemplate.insert(96,3);

    // leg templates
    this._upperLegTemplate = new BoneTemplate();
    this._upperLegTemplate.insert(0,5);
    this._upperLegTemplate.insert(10,8);
    this._upperLegTemplate.insert(60,11);
    this._upperLegTemplate.insert(96,5);
    this._upperLegTemplate.insert(100,5);

    this._lowerLegTemplate = new BoneTemplate();
    this._lowerLegTemplate.insert(0,3);
    this._lowerLegTemplate.insert(10,6);
    this._lowerLegTemplate.insert(45,8);
    this._lowerLegTemplate.insert(96,3);
    this._lowerLegTemplate.insert(100,3);

    // Biped links are created inside bounding box - each added to the display list after creation
    this.__createBiped(x, y, w, h);

    this.__drawCOM(h);

    this._COM.visible = false;

    this._bipedContainer.addChild(this._COM);
  }

  protected __createBiped(x: number, y: number, w: number, h: number): void
  {
    // TODO Refs to notify handlers for proper destruction of the Biped

    // Set COM coordinates
    this._comX = x + 0.5*w;
    this._comY = y + Biped.COM_Y*h;

    // pelvis bounding box - position pelvis so that center of box corresponds with the COM
    const pelvisW: number = Biped.PELVIS_X * w;
    const pelvisH: number = Biped.PELVIS_Y * h;
    const pelvisX: number = this._comX - 0.5*pelvisW;
    const pelvisY: number = this._comY - 0.5*pelvisH;

    const pelvisContext: IGraphics = new PIXI.Graphics();

    this._pelvis = new Pelvis(
      pelvisContext,
      pelvisX,
      pelvisY,
      pelvisW,
      pelvisH,
      this._pelvisTemplate,
      ColorEnum.YELLOW,
      ColorEnum.YELLOW_OVER
    );

    this._limbs[Biped.PELVIS] = this._pelvis;

    this._pelvis.register(BONE_PROPS.BONE_ROLL_OVER, (evt: any) => this.__onChainNotify(this._pelvis));
    this._pelvis.register(BONE_PROPS.BONE_ROLL_OUT , (evt: any) => this.__onChainNotify(this._pelvis));
    this._pelvis.register(BONE_PROPS.BONE_SELECTED , (evt: any) => this.__onChainNotify(this._pelvis));

    this._bipedContainer.addChild(pelvisContext);

    // pelvis is direct-linked to COM
    this.addLink(this._pelvis);

    // Spine
    const spineW: number = Biped.SPINE_X * w;
    const spineH: number = Biped.SPINE_Y * h;
    const spineX: number = this._comX - 0.5*spineW;
    const spineY: number = pelvisY - spineH;

    const spineContext: IGraphics = new PIXI.Graphics();

    this._spine = new SimpleSpine(
      spineContext,
      spineX,
      spineY,
      spineW,
      spineH,
      this._spineTemplate,
      ColorEnum.SPINE_GREEN,
      ColorEnum.SPINE_GREEN_OVER
    );

    this._limbs[Biped.SPINE] = this._spine;

    // Spine is linked to the mid-terminator of the Pelvis - spine auto-orients on creation
    this._pelvis.link(this._spine, BONE_PROPS.MIDDLE, false);

    this._spine.register(BONE_PROPS.BONE_ROLL_OVER, (evt: any) => this.__onChainNotify(this._spine));
    this._spine.register(BONE_PROPS.BONE_ROLL_OUT , (evt: any) => this.__onChainNotify(this._spine));
    this._spine.register(BONE_PROPS.BONE_SELECTED , (evt: any) => this.__onChainNotify(this._spine));

    this._bipedContainer.addChild(spineContext);

    // Neck
    const neckH: number = Biped.NECK_Y * h;
    const neckW: number = neckH;
    const neckX: number = this._comX - 0.5*neckW;
    const neckY: number = spineY - neckH;

    const neckContext: IGraphics = new PIXI.Graphics();

    this._neck = new Neck(
      neckContext,
      neckX,
      neckY,
      neckW,
      neckH,
      this._neckTemplate,
      ColorEnum.SPINE_GREEN,
      ColorEnum.SPINE_GREEN_OVER
    );

    this._limbs[Biped.NECK] = this._neck;

    // Neck is linked to the mid-terminator of the Spine
    this._spine.link(this._neck, BONE_PROPS.MIDDLE, false);

    this._neck.register(BONE_PROPS.BONE_ROLL_OVER, (evt: any) => this.__onChainNotify(this._neck));
    this._neck.register(BONE_PROPS.BONE_ROLL_OUT , (evt: any) => this.__onChainNotify(this._neck));
    this._neck.register(BONE_PROPS.BONE_SELECTED , (evt: any) => this.__onChainNotify(this._neck));

    this._bipedContainer.addChild(neckContext);

    // Left clavicle
    const lcW: number = Biped.CLAV_X * w;
    const lcH: number = 0.5*neckH;
    const lcX: number = this._neck.rightX;
    const lcY: number = this._neck.rightY;

    const leftClavicleContext: IGraphics = new PIXI.Graphics();

    this._leftClavicle = new Clavicle(
      leftClavicleContext,
      lcX,
      lcY,
      lcW,
      lcH,
      Clavicle.LEFT,
      this._clavicleTemplate,
      ColorEnum.SPINE_GREEN,
      ColorEnum.SPINE_GREEN_OVER
    );

    // Left-clavicle is linked to the right-terminator of the Neck
    this._neck.link(this._leftArm, BONE_PROPS.RIGHT, false);

    this._leftClavicle.register(BONE_PROPS.BONE_ROLL_OVER, (evt: any) => this.__onChainNotify(this._leftClavicle));
    this._leftClavicle.register(BONE_PROPS.BONE_ROLL_OUT , (evt: any) => this.__onChainNotify(this._leftClavicle));
    this._leftClavicle.register(BONE_PROPS.BONE_SELECTED , (evt: any) => this.__onChainNotify(this._leftClavicle));

    this._bipedContainer.addChild(leftClavicleContext);

    // Right clavicle
    const rcW: number = Biped.CLAV_X * w;
    const rcH: number = 0.5*neckH;
    const rcX: number = this._neck.leftX - rcW;
    const rcY: number = this._neck.leftY;

    const rightClavicleContext: IGraphics = new PIXI.Graphics();

    this._rightClavicle = new Clavicle(
      rightClavicleContext,
      rcX,
      rcY,
      rcW,
      rcH,
      Clavicle.RIGHT,
      this._clavicleTemplate,
      ColorEnum.SPINE_GREEN,
      ColorEnum.SPINE_GREEN_OVER
    );

    // Right-clavicle is linked to the left-terminator of the Neck
    this._neck.link(this._rightClavicle, BONE_PROPS.LEFT, false);

    this._rightClavicle.register(BONE_PROPS.BONE_ROLL_OVER, (evt: any) => this.__onChainNotify(this._rightClavicle));
    this._rightClavicle.register(BONE_PROPS.BONE_ROLL_OUT , (evt: any) => this.__onChainNotify(this._rightClavicle));
    this._rightClavicle.register(BONE_PROPS.BONE_SELECTED , (evt: any) => this.__onChainNotify(this._rightClavicle));

    this._bipedContainer.addChild(rightClavicleContext);

    // Head
    const headW: number = Biped.HEAD_X * w;
    const headH: number = Biped.HEAD_Y * h;
    const headX: number = this._comX - 0.5*headW;
    const headY: number = neckY - headH;

    const headContext: IGraphics = new PIXI.Graphics();

    this._head = new Head(
      headContext,
      headX,
      headY,
      headW,
      headH,
      this._headTemplate,
      ColorEnum.LIGHT_BLUE,
      ColorEnum.LIGHT_BLUE_OVER
    );

    // Head is linked to the middle-terminator of the Neck
    this._neck.link(this._head, BONE_PROPS.MIDDLE, false);

    this._head.register(BONE_PROPS.BONE_ROLL_OVER, (evt: any) => this.__onChainNotify(this._head));
    this._head.register(BONE_PROPS.BONE_ROLL_OUT , (evt: any) => this.__onChainNotify(this._head));
    this._head.register(BONE_PROPS.BONE_SELECTED , (evt: any) => this.__onChainNotify(this._head));

    this._bipedContainer.addChild(headContext);

    // left arm (Biped facing forward)
    const lArmX: number = this._leftArm.midX;
    const lArmY: number = this._leftArm.midY;
    const armW: number  = Biped.ARM_X * w;
    const armH: number  = Biped.ARM_Y * h;

    const leftArmContext: IGraphics = new PIXI.Graphics();
    const leftArmContext2: IGraphics = new PIXI.Graphics();

    this._leftArm = new Arm(
      leftArmContext,
      leftArmContext2,
      lArmX,
      lArmY,
      armW,
      armH,
      BONE_PROPS.LEFT,
      this._upperArmTemplate,
      this._foreArmTemplate,
      ColorEnum.BLUE,
      ColorEnum.BLUE_OVER
    );

    // Left Arm is linked to the middle-terminator of the Left Clavicle
    this._leftArm.link(this._leftClavicle, false);

    this._bipedContainer.addChild(leftArmContext);
    this._bipedContainer.addChild(leftArmContext2);

    // left hand
    const handW: number  = armW * 0.25;
    const handH: number  = armH * 0.15;
    const lhandX: number = lArmX + armW;
    const lhandY: number = lArmY + armH;

    const leftHandContext: IGraphics = new PIXI.Graphics();

    this._leftHand = new Hand(
      leftHandContext,
      lhandX,
      lhandY,
      handW,
      handH,
      BONE_PROPS.LEFT,
      this._handTemplate,
      ColorEnum.BLUE,
      ColorEnum.BLUE_OVER
    );

    // Left Hand is linked to the end-effector of the left arm chain
    this._leftArm.link(this._leftHand, true);

    this._leftHand.register(BONE_PROPS.BONE_ROLL_OVER, (evt: any) => this.__onChainNotify(this._leftHand));
    this._leftHand.register(BONE_PROPS.BONE_ROLL_OUT , (evt: any) => this.__onChainNotify(this._leftHand));
    this._leftHand.register(BONE_PROPS.BONE_SELECTED , (evt: any) => this.__onChainNotify(this._leftHand));

    this._bipedContainer.addChild(leftHandContext);

    // right arm (Biped facing forward)
    const rArmX: number = this._rightClavicle.midX - armW;
    const rArmY: number = this._rightClavicle.midY;

    const rightArmContext: IGraphics  = new PIXI.Graphics();
    const rightArmContext2: IGraphics = new PIXI.Graphics();

    this._rightArm = new Arm(
      rightArmContext,
      rightArmContext2,
      rArmX,
      rArmY,
      armW,
      armH, BONE_PROPS.RIGHT,
      this._upperArmTemplate,
      this._foreArmTemplate,
      ColorEnum.ARM_GREEN,
      ColorEnum.ARM_GREEN_OVER
    );

    // Right Arm is linked to the middle-terminator of the Right Clavicle
    this._rightClavicle.link(this._rightArm, BONE_PROPS.MIDDLE, false);

    this._bipedContainer.addChild(rightArmContext);
    this._bipedContainer.addChild(rightArmContext2);

    // right hand
    const rhandX: number = rArmX - handW;
    const rhandY: number = rArmY + armH;

    const rightHandContext: IGraphics = new PIXI.Graphics();

    this._rightHand = new Hand(
      rightHandContext,
      rhandX,
      rhandY,
      handW,
      handH,
      BONE_PROPS.RIGHT,
      this._handTemplate,
      ColorEnum.ARM_GREEN,
      ColorEnum.ARM_GREEN_OVER
    );

    // Right Hand is linked to the end-effector of the right arm chain
    this._rightArm.link(this._rightHand, true);

    this._rightHand.register(BONE_PROPS.BONE_ROLL_OVER, (evt: any) => this.__onChainNotify(this._rightHand));
    this._rightHand.register(BONE_PROPS.BONE_ROLL_OUT , (evt: any) => this.__onChainNotify(this._rightHand));
    this._rightHand.register(BONE_PROPS.BONE_SELECTED , (evt: any) => this.__onChainNotify(this._rightHand));

    this._bipedContainer.addChild(rightHandContext);

    // left leg (Biped facing forward)
    const lLegX: number = this._pelvis.rightX;
    const lLegY: number = this._pelvis.rightY;
    const legW: number  = Biped.LEG_X * w;
    const legH: number  = Biped.LEG_Y * h;

    const leftLegContext: IGraphics  = new PIXI.Graphics();
    const leftLegContext2: IGraphics = new PIXI.Graphics();

    this._leftLeg = new Leg(
      leftLegContext,
      leftLegContext2,
      lLegX,
      lLegY,
      legW,
      legH,
      BONE_PROPS.LEFT,
      this._upperLegTemplate,
      this._lowerLegTemplate,
      ColorEnum.BLUE,
      ColorEnum.BLUE_OVER
    );

    // Left Leg is linked to the right-terminator of the Pelvis
    this._pelvis.link(this._leftLeg, BONE_PROPS.RIGHT, false);

    this._bipedContainer.addChild(leftLegContext);
    this._bipedContainer.addChild(leftLegContext2);

    // right leg (Biped facing forward)
    const rLegX: number = this._pelvis.leftX - legW;
    const rLegY: number = this._pelvis.leftY;

    const rightLegContext: IGraphics  = new PIXI.Graphics();
    const rightLegContext2: IGraphics = new PIXI.Graphics();

    this._rightLeg = new Leg(
      rightLegContext,
      rightLegContext2,
      rLegX,
      rLegY,
      legW,
      legH,
      BONE_PROPS.RIGHT,
      this._upperLegTemplate,
      this._lowerLegTemplate,
      ColorEnum.ARM_GREEN,
      ColorEnum.ARM_GREEN_OVER
    );

    // Right Leg is linked to the left-terminator of the Pelvis
    this._pelvis.link(this._rightLeg, BONE_PROPS.LEFT, false);

    this._bipedContainer.addChild(rightLegContext);
    this._bipedContainer.addChild(rightLegContext2);

    // left foot
    const footW: number  = legW * 0.7;
    const footH: number  = legH * 0.075;
    const lfootX: number = this._leftLeg.terminalX - 0.5*footW;
    const lfootY: number = lLegY + legH;

    const leftFootContext: IGraphics = new PIXI.Graphics();

    this._leftFoot = new Foot(
      leftFootContext,
      lfootX,
      lfootY,
      footW,
      footH,
      BONE_PROPS.LEFT,
      this._footTemplate,
      ColorEnum.BLUE,
      ColorEnum.BLUE_OVER
    );

    // Left Foot is linked to the end-effector of the left leg chain, but retains default orientation
    this._leftLeg.link(this._leftFoot, false);

    this._leftFoot.register(BONE_PROPS.BONE_ROLL_OVER, (evt: any) => this.__onChainNotify(this._leftFoot));
    this._leftFoot.register(BONE_PROPS.BONE_ROLL_OUT , (evt: any) => this.__onChainNotify(this._leftFoot));
    this._leftFoot.register(BONE_PROPS.BONE_SELECTED , (evt: any) => this.__onChainNotify(this._leftFoot));

    this._bipedContainer.addChild(leftFootContext);

    // right foot
    const rfootX: number = this._rightLeg.terminalX - 0.5*footW;
    const rfootY: number = rLegY + legH;

    const rightFootContext: IGraphics = new PIXI.Graphics();

    this._rightFoot = new Foot(
      rightFootContext,
      rfootX,
      rfootY,
      footW,
      footH,
      BONE_PROPS.RIGHT,
      this._footTemplate,
      ColorEnum.ARM_GREEN,
      ColorEnum.ARM_GREEN_OVER
    );

    // Right Foot is linked to the end-effector of the right leg chain, but retains default orientation
    this._rightLeg.link(this._rightFoot, false);

    this._rightFoot.register(BONE_PROPS.BONE_ROLL_OVER, (evt: any) => this.__onChainNotify(this._rightFoot));
    this._rightFoot.register(BONE_PROPS.BONE_ROLL_OUT , (evt: any) => this.__onChainNotify(this._rightFoot));
    this._rightFoot.register(BONE_PROPS.BONE_SELECTED , (evt: any) => this.__onChainNotify(this._rightFoot));

    this._bipedContainer.addChild(rightFootContext);
  }

  // deprecated
  public get mouseEvent(): string     { return this._mouseEvent; }

  // TODO re-evaluate these accessors
  public get selected():Object        { return this._selected;   }
  public get orientation(): number    { return this._angle >= 0 ? this._angle : Connector.TWO_PI+this._angle; }
  public get endOrientation(): number { return this._angle >= 0 ? this._angle : Connector.TWO_PI+this._angle; }
  public get linkedTo(): Linkable     { return this._linkedTo; }
  public get isComSelected(): boolean { return this._comSelected; }

  /**
   * Enable or disable all limbs in the Biped
   *
   * @param b True if all limbs are enabled, false otherwise
   */
  public set enabled(b: boolean)
  {
    if (this._head != null) {
      this._head.ENABLED = b;
    }

    if (this._neck != null) {
      this._neck.ENABLED = b;
    }

    if (this._leftArm != null) {
      this._leftArm.enabled = b;
    }

    if (this._rightClavicle != null) {
      this._rightClavicle.ENABLED = b;
    }

    if (this._leftArm != null) {
      this._leftArm.enabled = b;
    }

    if (this._rightArm != null) {
      this._rightArm.enabled = b;
    }

    if (this._leftHand != null) {
      this._leftHand.ENABLED = b;
    }

    if (this._rightHand != null) {
      this._rightHand.ENABLED = b;
    }

    if (this._spine != null) {
      this._spine.ENABLED = b;
    }

    if (this._pelvis != null) {
      this._pelvis.ENABLED = b;
    }

    if (this._leftLeg != null) {
      this._leftLeg.enabled = b;
    }

    if (this._rightLeg != null) {
      this._rightLeg.enabled = b;
    }
  }

  /**
   * Assign a forward linkage for this Biped
   *
   * @param c Linkage to which forward transforms are propagated
   */
  public set linkedTo(c: Linkable)
  {
    this._linkedTo = c;
  }

  /**
   * Prepare the Biped rig for garbage collection
   */
  public destruct(): void
  {
    // TODO
  }

 /**
  * Add a link to the Biped COM
  *
  * @param link Reference to Connector or Chain to be linked to the COM - must implement the IChain interface
  */
  public addLink(link: Linkable): void
  {
    // no error-checking ... you break it, you buy it.  Unlinking may be added later.
    this._links.push(link);

    link.linkedTo = this._COM;
    this._numLinks++;
  }

 /**
  * Select and highlight the Biped's COM
  *
  * @param select true if COM is selected and highlighted
  */
  public selectCOM(select: boolean ): void
  {
    this._selected    = select === true ? this._COM : null;
    this._comSelected = select === true;
    this._COM.visible = select === true;
  }

 /**
  * Move the rig's COM - FK causes remainder of chain to move
  *
  * @param toX New x-coordinate
  *
  * @param toY New y-coordinate
  *
  */
  public move(toX: number, toY: number): void
  {
    this._comX = toX;
    this._comY = toY;

    if (this._comSelected)
    {
      this._COM.x = this._comX;
      this._COM.y = this._comY;
    }

    this._links.forEach( (link: IChain): void => {
      link.move(toX, toY);
    });
  }

 /**
  * Rotate the Biped about the COM
  *
  * @param angle Rotation angle in radians in [0,2pi]
  *
  */
  public rotate(angle: number): void
  {
    // compute the delta angle
    const newAngle: number   = angle >= 0 ? angle  : Connector.TWO_PI + angle;
    const deltaAngle: number = newAngle - this.orientation;
    this._angle              = newAngle;

    this._links.forEach( (link: IChain): void => {
      link.offsetOrientation(deltaAngle);
    });
  }

  public moveAndRotate(toX: number, toY: number, deltaAngle: number): void
  {
    // TODO
  }

 /**
  * Draw the Biped
  */
  public draw(): void
  {
    // in the future, it may be allowable to delete a limb, so test each one individually
    if (this._head != null) {
      this._head.draw();
    }

    if (this._neck != null) {
      this._neck.draw();
    }

    if (this._leftArm != null) {
      this._leftArm.draw();
    }

    if (this._rightClavicle != null) {
      this._rightClavicle.draw();
    }

    if (this._leftArm != null)
    {
      this._leftArm.draw();

    }

    if (this._leftHand != null) {
      this._leftHand.draw();
    }

    if (this._rightArm != null) {
      this._rightArm.draw();
    }

    if (this._rightHand != null) {
      this._rightHand.draw();
    }

    if (this._spine != null) {
      this._spine.draw();
    }

    if (this._pelvis != null) {
      this._pelvis.draw();
    }

    if (this._leftLeg != null) {
      this._leftLeg.draw();
    }

    if (this._rightLeg != null) {
      this._rightLeg.draw();
    }

    if (this._leftFoot != null) {
      this._leftFoot.draw();
    }

    if (this._rightFoot != null) {
      this._rightFoot.draw();
    }
  }

  // this function handles low-level notification from any chain or connector
  protected __onChainNotify(c: any): void
  {
    // notification is from a Bone or a Connector
    this._selected = c;

    if (this._notify != null) {
      this._notify(this);
    }
  }

  // draw the Biped's COM given  height
  protected __drawCOM(height: number): void
  {
    const h: number    = 0.2*Biped.PELVIS_Y*height + 2;
    const g: IGraphics = this._COM;

    g.lineStyle(1, '0xffffff');
    g.moveTo(0, -h);
    g.lineTo(h, 0);
    g.lineTo(0, h);
    g.lineTo(-h, 0);
    g.lineTo(0, -h);
    g.lineTo(0, h);
    g.moveTo(-h, 0);
    g.lineTo(h, 0);

    this._COM.x = this._comX;
    this._COM.y = this._comY;
  }
}
