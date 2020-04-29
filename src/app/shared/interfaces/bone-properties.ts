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
 * Bone properties that help drive kinematics and rendering
 *
 * @author Jim Armstrong
 *
 * @version 1.0
 */

export enum BONE_PROPS
{
  BONE_NONE      = "NONE",
  BONE_ROLL_OVER = "ROVR",
  BONE_ROLL_OUT  = "ROUT",
  BONE_SELECTED  = "BSEL",
  ON_INITIAL     = "OI",
  ON_FINAL       = "OF",

  // type of FK motion
  NONE      = "FK_N",
  FK_MOVE   = "FK_M",
  FK_ROTATE = "FK_R",

  // bone type (for drawing)
  STANDARD = "ST",
  CUSTOM   = "CU",

  // Directions
  LEFT   = "L",
  RIGHT  = "R",
  MIDDLE = "M",

  // Enable/Renderable
  ENABLED    = 'ENABLE',
  RENDERABLE = 'RENDERABLE'
}
