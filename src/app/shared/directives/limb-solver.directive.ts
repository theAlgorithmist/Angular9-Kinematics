/**
 * Copyright 2020 Jim Armstrong (www.algorithmist.net)
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
 */

/**
 * This directive manages display and interaction of a two-bone system with a graphic end-effector.  The display serves
 * as an interactive testbed for a limb-solver (or two-joint solver) with joint limits.
 *
 * @author Jim Armstrong (www.algorithmist.net)
 *
 * @version 1.0
 */

import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
} from '@angular/core';

import * as PIXI from 'pixi.js/dist/pixi.js';

import { Chain     } from '../libs/rigs/chain';
import { BoneModel } from '../interfaces/bone-model';
import { IGraphics } from '../interfaces/graphics';

// Limb Solver
import { limbSolver } from '../libs/ik-solvers/limb-solver';

import Rectangle = PIXI.Rectangle;

@Directive({selector: '[limb-solver]'})
export class LimbSolverDirective implements OnInit, OnDestroy
{
  protected _domContainer: HTMLDivElement;        // Container for PIXI Canvas
  protected _rect: Rectangle;                     // display area bounding rectangle

  // PIXI app and stage references
  protected _app: PIXI.Application;
  protected _stage: PIXI.Container;
  protected _width: number;
  protected _height: number;

  // Visual representations of each bone and the end-effector
  protected _bone0Context: PIXI.Graphics;
  protected _bone1Context: PIXI.Graphics;
  protected _endEffector: PIXI.Graphics;

  // static PIXI options #C3E4ED
  protected static OPTIONS: Object = {
    backgroundColor: 0xF0F8FF,
    antialias: true
  };

  protected _bone: BoneModel;             // reference to a single bone
  protected _chain: Chain;                // primary bone chain

  protected _dragging: boolean;           // true if dragging end effector
  protected _data: PIXI.InteractionData;  // Pixi js data object while dragging
  protected _px: number;
  protected _py: number;
  protected _ex: number;
  protected _ey: number;

  protected _mouseDownHandler: (evt: PIXI.InteractionEvent) => void;
  protected _mouseUpHandler: (evt: PIXI.InteractionEvent) => void;
  protected _mouseMoveHandler: (evt: PIXI.InteractionEvent) => void;

  constructor(protected _elRef: ElementRef)
  {
    this._domContainer = <HTMLDivElement> this._elRef.nativeElement;

    this._width  = this._elRef.nativeElement.clientWidth;
    this._height = this._elRef.nativeElement.clientHeight;

    this._bone     = null;
    this._chain    = new Chain();
    this._dragging = false;

    // Specify the limb solver as the IK solver for the two-bone chain
    this._chain.ikSolver = limbSolver;

    this._mouseDownHandler = (evt: PIXI.InteractionEvent) => this.__onMouseDown(evt);
    this._mouseUpHandler   = (evt: PIXI.InteractionEvent) => this.__onMouseUp(evt);
    this._mouseMoveHandler = (evt: PIXI.InteractionEvent) => this.__onMouseMove(evt);

    this.__pixiSetup();
  }

  public ngOnInit(): void
  {
    this._rect = this._elRef.nativeElement.getBoundingClientRect();

    this.__createJoints();
  }

  public ngOnDestroy(): void
  {
    this._endEffector
      .off('mousedown', this._mouseDownHandler)
      .off('mouseup', this._mouseUpHandler)
      .off('mousemove', this._mouseMoveHandler);
  }

  protected __onMouseDown(event: PIXI.InteractionEvent): void
  {
    this._dragging = true;
    this._data     = event.data;
    this._px       = event.data.global.x;
    this._py       = event.data.global.y;
  }

  protected __onMouseUp(event: PIXI.InteractionEvent): void
  {
    this._dragging = false;
  }

  protected __onMouseMove(event: PIXI.InteractionEvent): void
  {
    if (this._dragging)
    {
      const dx: number = this._data.global.x - this._px;
      const dy: number = this._data.global.y - this._py;

      // move the ik chain end effector to the new target
      const resolved: boolean = this._chain.moveEndEffector(this._ex + dx, this._ey + dy);

      this._endEffector.x = this._ex + dx;
      this._endEffector.y = this._ey + dy;
    }
  }

  protected __pixiSetup(): void
  {
    const options = {width: this._width, height: this._height, ...LimbSolverDirective.OPTIONS};
    this._app     = new PIXI.Application(options);

    this._domContainer.appendChild(this._app.view);

    this._stage             = this._app.stage;
    this._stage.interactive = true;

    this._bone0Context = new PIXI.Graphics();
    this._bone1Context = new PIXI.Graphics();
    this._endEffector  = new PIXI.Graphics();

    this._stage.addChild(this._bone0Context);
    this._stage.addChild(this._bone1Context);
    this._stage.addChild(this._endEffector);
  }

  protected __createJoints(): void
  {
    const xRoot: number = 0.5 * this._width;
    const yRoot: number = 0.5 * this._height;

    // bone lengths must be greater than zero and preferably non-equal.  A lot of advertised limb solvers only work for
    // equal bone lengths
    const l1: number = 100;
    const l2: number = 50;

    // coordinates are hardcoded for demo purposes
    const bone0: BoneModel = this._chain.createBone(this._bone0Context);
    bone0.NAME             = 'Upper Bone';
    bone0.ID               = 0;
    bone0.disableMouseEvents();
    bone0.setInitial(xRoot, yRoot);
    bone0.setTerminal(xRoot + l1, yRoot);
    bone0.draw();

    const bone1: BoneModel = this._chain.createBone(this._bone1Context);
    bone1.NAME             = 'Lower Bone';
    bone1.ID               = 1;
    bone1.disableMouseEvents();
    bone1.setInitial(xRoot + l1, yRoot);
    bone1.setTerminal(xRoot + l1 + l2, yRoot);
    bone1.draw();

    // a circle represents the end effector
    this._endEffector.beginFill('0x0000ff');
    this._endEffector.drawCircle(0, 0, 5);
    this._endEffector.endFill();
    this._endEffector.x = xRoot + l1 + l2;
    this._endEffector.y = yRoot;

    // end-effector reference coords
    this._ex = xRoot + l1 + l2;
    this._ey = yRoot;

    // end-effector dragging
    this._endEffector.interactive = true;
    this._endEffector
      .on('mousedown', this._mouseDownHandler)
      .on('mouseup', this._mouseUpHandler)
      .on('mousemove', this._mouseMoveHandler);
  }
}
