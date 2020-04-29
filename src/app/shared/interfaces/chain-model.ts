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

import { BoneModel } from './bone-model';
import { Linkable  } from './linkable';
import { IkSolver  } from './ik-solver';
import { SKIN_TYPE } from '../libs/rigs/bone';

/**
 * Model for a bone chain
 *
 * @author Jim Armstrong
 *
 * @version 1.0
 */

export interface IChain
{
  // Chain properties
  NAME: string;
  ID: number;
  REDRAW_ON_SOLVE: boolean;

  // Skin Type
  skinType: SKIN_TYPE;

  // Root and Terminal Bones in the chain
  root: BoneModel;
  terminal: BoneModel;

  // Linkages (forward and inverse)
  linkedTo: Linkable;
  linkedFrom: Linkable;

  size: number;                // number of bones in the chain

  orientation: number;         // orientation of root bone in radians

  endOrientation: number;      // orientation of terminal bone in radians

  ikSolver: IkSolver;          // ik solver assigned to this chain

  initX: number;               // initial x-coordinate of root bone

  initY: number;               // initial y-coordinate of root bone

  terminalX: number;           // terminal x-coordinate of terminal bone

  terminalY: number;           // terminal y-coordinate of terminal bone

  // move the root bone of the chain to the specified coordinates
  move(toX: number, toY: number): void;

  // rotate the root bone of the chain by the specified delta angle
  rotate(deltaAngle: number);

  // move and rotate the root bone of the chain
  moveAndRotate(toX: number, toY: number, deltaAngle: number): void;

  // access offset orientation given a delta angle
  offsetOrientation(deltaAngle: number): void;

  // reference to the i-th bone in the chain
  getBone(i: number): BoneModel;

  // move the chain end effector towards the specified coordinates and return true if the move can be accomplished
  moveEndEffector(toX: number, toY: number, isPinned: boolean): boolean;
}
