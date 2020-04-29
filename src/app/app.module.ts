import { BrowserModule } from '@angular/platform-browser';
import { NgModule      } from '@angular/core';

import { FkChainTestComponent    } from './test-components/fk-chain/fk-chain-test.component';
import { BoneChainDirective      } from './shared/directives/bone-chain.directive';
import { CcdStepsComponent       } from './test-components/ccd-steps/ccd-steps.component';
import { CcdStepsDirective       } from './shared/directives/ccd-steps.directive';
import { IkSolverDirective       } from './shared/directives/ik-solver.directive';
import { IkSolverTestComponent   } from './test-components/ik-solver/ik-solver-test.component';
import { LimbSolverTestComponent } from './test-components/limb-solver/limb-solver-test.component';
import { LimbSolverDirective     } from './shared/directives/limb-solver.directive';
import { SkinTestComponent       } from './test-components/skin-test/skin-test.component';
import { SkinTestDirective       } from './shared/directives/skin-test.directive';

@NgModule({
  declarations: [
    FkChainTestComponent,
    CcdStepsComponent,
    BoneChainDirective,
    CcdStepsDirective,
    IkSolverTestComponent,
    IkSolverDirective,
    LimbSolverTestComponent,
    LimbSolverDirective,
    SkinTestComponent,
    SkinTestDirective
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  // Replace the bootstrap component to run other tests; crude but quick :)
  bootstrap: [FkChainTestComponent]
  // bootstrap: [CcdStepsComponent]
  // bootstrap: [IkSolverTestComponent]
  // bootstrap: [LimbSolverTestComponent]
  // bootstrap: [SkinTestComponent]
})
export class AppModule { }
