import { Component } from '@angular/core';

@Component({
  selector: 'app-root',

  templateUrl: './limb-solver-test.component.html',

  styleUrls: ['./limb-solver-test.component.scss']
})
export class LimbSolverTestComponent
{
  public title: string;
  public instructions: string;

  constructor()
  {
    this.title        = '2-Joint Limb Solver Test.';
    this.instructions = 'Move end-effector to activate limb solver; JOINT LIMITS ARE ACTIVE!';
  }
}
