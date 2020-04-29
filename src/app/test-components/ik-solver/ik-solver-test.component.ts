import {
  Component,
  ViewChild,
} from '@angular/core';

import { IkSolverDirective } from '../../shared/directives/ik-solver.directive';

@Component({
  selector: 'app-root',

  templateUrl: './ik-solver-test.component.html',

  styleUrls: ['./ik-solver-test.component.scss']
})
export class IkSolverTestComponent
{
  @ViewChild(IkSolverDirective, {static: true})
  private _boneChain: IkSolverDirective;

  public title = 'IK Solver Test.';
  public instructions: string;
  public chainTerminated: boolean;
  public boneCount: number;
  public showNext: boolean;

  constructor()
  {
    this.instructions    = 'Click to define bone chain.  Press SPACE bar to terminate chain.';
    this.chainTerminated = false;
    this.showNext        = false;
    this.boneCount       = 0;
  }

  public onBoneAdded(): void
  {
    this.boneCount++;
  }

  public onBoneTerminated(type: string): void
  {
    switch (type.toLowerCase())
    {
      case 'add':
        // nothing done at present
        break;

      case 'end':
        this.chainTerminated = true;
        this.instructions = 'Move Hand bone to activate IK Solver';
        break;
    }
  }
}
