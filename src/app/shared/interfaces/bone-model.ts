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

import { BONE_PROPS   } from './bone-properties';
import { Linkable     } from './linkable';
import { BoneTemplate } from '../libs/rigs/bone-template';
import { SKIN_TYPE    } from '../libs/rigs/bone';

/**
 * Model for a single bone
 *
 * @author Jim Armstrong
 *
 * @version 1.0
 */

export interface BoneModel
{
  // Basic (public) bone properties
  NAME: string;
  ID: number;
  ENABLED: boolean;
  RENDERABLE: boolean;
  LINE_THICKNESS: number;
  LINE_COLOR: string;
  FILL_COLOR: string;
  ROLL_OVER_COLOR: string;
  SELECTED_COLOR: string;
  INTERPOLATE: boolean;
  NEXT: BoneModel;
  PREV: BoneModel;
  IS_ROOT: boolean;
  IS_END: boolean;
  IS_STRETCH: boolean;
  SKIN_ONLY: boolean;

  // bone linkages (forward and inverse)
  linkedTo: Linkable;
  linkedFrom: Linkable;

  // bone length
  length: number;

  // current orientation
  orientation: number;

  // end orientation
  endOrientation: number;

  // assign the type of geometric figure used to draw the bone
  drawType: BONE_PROPS;

  // initial joint coordinates
  initX: number;
  initY: number;

  // terminal joint coordinates
  terminalX: number;
  terminalY: number;

  // Type of FK (translate or rotate)
  fkType: string;

  // Skin Type
  skinType: SKIN_TYPE;

  // Custom Bone Template
  template: BoneTemplate;

  // Access the skin points for this bone
  getSkinPoints(upper: boolean): Array<number>;

  // set initial joint coordinates
  setInitial(cX: number, cY: number, updateLength?: boolean): void;

  // set terminal joint coordinates
  setTerminal(cX: number, cy: number): void;

  // move the bone to the specified coordinates (preserves orientation)
  move(toX: number, toY: number): void

  // move the initial coordinates, offsetting terminal coordinates to maintain orientation
  moveInitial(toX: number, toY: number): void;

  // rotate the into a new orientation
  rotate(toAngle: number, c?: number, s?: number): void;

  // move the bone and rotate into a new orientation
  moveAndRotate(toX: number, toY: number, toAngle: number, c?: number, s?: number): void;

  // Satisfy the Linkable type
  moveEndEffector(toX: number, toY: number, isPinned: boolean): boolean

  reorient(toX: number, toY: number, angle: number, move: boolean, rotate: boolean): void;

  // initialize bone, also used to reset bone parameters other than handlers and provide a graphic context
  init(): void;

  // deep-six the bone, preparing the class instance to be marked for garbage collection
  destruct(): void;

  // draw the Bone
  draw(): void;

  // select this bone outside of mouse interaction
  select(): void;

  // deselect the bone
  deselect(): void;

  // register callback for low-level interaction
  register(e: string, f: Function): void;

  // enable and disable mouse events on the bone
  enableMouseEvents(): void;
  disableMouseEvents(): void;

  // assign a specific handler to this bone
  setHandler(type: string, f: (b: BoneModel) => void);
}
