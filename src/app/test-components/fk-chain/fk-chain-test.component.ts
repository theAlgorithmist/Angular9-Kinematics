import {
  Component,
  ViewChild,
} from '@angular/core';

import { BoneChainDirective } from '../../shared/directives/bone-chain.directive';

@Component({
  selector: 'app-root',

  templateUrl: './fk-chain-test.component.html',

  styleUrls: ['./fk-chain-test.component.scss']
})
export class FkChainTestComponent
{
  @ViewChild(BoneChainDirective)
  private _boneChain: BoneChainDirective;

  public title = 'Forward Kinematics Mixed Chain';
  public instructions: string;
  public chainTerminated: boolean;
  public boneCount: number;

  constructor()
  {
    this.instructions    = 'Click to define bone chain.  Press SPACE bar to terminate chain.';
    this.chainTerminated = false;
    this.boneCount       = 0;
  }

  public onBoneAdded(): void
  {
    this.boneCount++;
  }

  public onBoneTerminated(): void
  {
    this.chainTerminated = true;
  }

  public onSliderChange(evt: any): void
  {
    // straight-line fit between (1,-1) and (100,1) - makes slider at 1 return -1 and slider at 100 return 1
    const m: number     = 2/99;                             // m = (y2 - y1)/(x2 - x1)
    const value: number = m*(evt.target.value - 1) - 1;     // y - y1 = m(x - x1)

    this._boneChain.rotatePercent(value);
  }
}
