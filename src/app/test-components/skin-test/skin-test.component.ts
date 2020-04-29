import { Component } from '@angular/core';

@Component({
  selector: 'app-root',

  templateUrl: './skin-test.component.html',

  styleUrls: ['./skin-test.component.scss']
})
export class SkinTestComponent
{
  public title: string;
  public instructions: string;

  constructor()
  {
    this.title        = '3-Bone Skinning Test.';
    this.instructions = 'Move end-effector to activate IK and observe skin changes.';
  }
}
