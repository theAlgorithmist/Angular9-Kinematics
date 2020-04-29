import {
  Component,
  ViewChild,
} from '@angular/core';

import { CcdStepsDirective } from '../../shared/directives/ccd-steps.directive';

@Component({
  selector: 'app-root',

  templateUrl: './ccd-steps.component.html',

  styleUrls: ['./ccd-steps.component.scss']
})
export class CcdStepsComponent
{
  @ViewChild(CcdStepsDirective, {static: true})
  private _boneChain: CcdStepsDirective;

  public title = '(IK) CCD Individual Steps Test.';
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
      case 'bone':
        this.chainTerminated = true;
        this.instructions = 'Click anywhere to place chain end-effector';
        break;

      case 'end-effector':
        this.showNext     = true;
        this.instructions = "Click 'Next' button to see a single step in CCD variant";
        break;

      case 'ik-solve-complete':
        console.log('ik solve complete');
        break;
    }
  }

  public onNext(): void
  {
    this._boneChain.next();
  }
}
