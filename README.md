# Angular 9 Kinematics

This is a beta release of a Typescript library for general 2D character rigging, with mixed forward and inverse kinematics for bone chains.  The Typescript version was derived from an ActionScript library I wrote in late 2006.  I gave a presentation on this topic at Fitc 2007 in Toronto.  Following is a link to the the slides from the talk, that serve as an introduction to the current library.

[Dynamic Skeletal Animation](https://docs.google.com/presentation/d/1XBeZdzERKB3DD8S6LNwAoLJ8q4oFJgUnLsQMPvzIzRk/edit?usp=sharing) by Jim Armstrong (Fitc Toronto 2007)

The current TypeScript library has been expanded beyond the scope of the original ActionScript version, and this distribution contains five Angular 9 demos.  The release is beta quality, which means there are some unfinished items in the library and the code has been through interaction testing commensurate with a typical beta release.  The 2D Biped code has been ported and modified, but only very lightly tested.  That portion of the library is considered experimental.

The primary challenge in this release was to 'get all the math to work'.  There are some architectural and other refactorings scheduled for future releases.

The library renders into a Canvas context, currently provided by Pixi JS.  This may be relaxed in the future.


Author:  Jim Armstrong - [The Algorithmist]

@algorithmist

theAlgorithmist [at] gmail [dot] com

Typescript Library: Beta 1.0

Angular: 9.0.0

Angular CLI: 9.0.1

Typescript: 3.7.5

Pixi JS: 4.8.1

## Introduction

The fundamental unit of character rigging is a bone.  Bones may be organized into chains, which are linkages of individual bones that correspond to a complete limb of a character.  For example, a biped arm consists of an upper arm bone, a forearm bone, and a complete set of bones that control the hand.  A minimal cartoon character would likely have at least the upper arm and forearm.  Bones are organized in a doubly-linked list.

Chains may be further organized into Connectors.  A Connector encapsulates multiple bone chains with the unique characteristic that all chains share a common origin point.

A bone exists to provide a programmatic means to alter the visual appearance of a 'skin'.  Skins may be individual Sprites, an outline associated with an individual bone, or an outline that corresponds to an entire chain.  Transforming a bone, e.g. move or rotate, causes a transformation of the skin.


## Bones

A _Bone_ is defined by initial and terminal coordinates (sometimes called joints) in 2D space.  Specification of these coordinates defines other features such as (Euclidean) length and orientation (angle with the positive x-axis).

A bone may be visually represented by either a default (or standard) outline or a custom template.  A bone template (which is currently rendered point-to-point with straight lines) is symmetric about the x-axis and rooted at the origin.  The template is transformed along with the bone.  A bone's visual representation is useful in debugging and many bone templates serve as a character skin.  It is possible to develop many cartoon-like characters (with limbs consisting of hard edges) using nothing but bone templates.

A bone may also have rotational limits applied, meaning that the bone may only be rotated about its root joint within a certain range.

A bone may be transformed by either translation or rotation.  It may also be simultaneously translated and rotated.  A bone may not be transformed in any way that alters its length.  Bone length can only be altered by changing the bone's initial and/or terminal joints.

## Chains

A chain consists of one or more bones in an ordered linkage.  A chain enforces the restriction that the initial joint of one bone must always match the terminal point of its predecessor.  A bone may be linked only to another bone, but a chain may be linked to another chain, a bone, or a Connector.  Chains are the primary means by which kinematics are applied to characters.

## Kinematics

Kinematics in bone chains are classified as either forward (FK for Forward Kinematics) or inverse (IK for Inverse Kinematics).

Forward kinematics means that a transform applied to one bone is automatically propagated forward to the next bone in the chain, and then onto the next bone, and so forth until the end of chain is encountered.  The transform is then propagated to anything forward-linked to the chain.  A forward transform affects only bones or linkages that are successors to the bone in which the transform is initially applied.  A common example is to rotate a bone in the middle of a chain.  Rotations are always applied about the root joint.  Remaining bones in the chain are rotated (and translated) to match the new orientation of the original bone.  

Now, suppose a single bone-chain that represents a primitive hand is forward-linked to an arm chain.  After the transform is propagated to end-of-chain, it is further propagated to the hand, since the hand is forward-linked to the chain.

Note that it is only possible to translate the root bone in a chain.  Rotation may be applied to any bone in a chain.

Inverse kinematics typically works from the end of the chain, backward.  There is a logical point called the end effector that corresponds to the terminal point of the bone chain.  Forward transforms do not alter this correspondence.  Moving the end effector causes the bone chain to be altered so that the root bone remains fixed at its root joint and the terminal point corresponds to the new end effector location.  The chain, however, must remain unbroken and individual bone rotational limits should be respected.  So, it may not be possible to orient the chain so that its terminal point exactly matches the location of the end effector.  In this case, the chain is oriented as close as possible and the transform is not completely resolved.

We can think of IK in a chain as working from the terminal bone in a chain, backward to the root, but this is not always the case.  An end effector may be 'pinned', meaning that its location (and thus the terminal joint of the terminal bone) is fixed.  Movement is applied to the root bone and the chain must be reoriented to preserved linkage, joint limits, and end effector location.  Think of a push-up, for example.  The hand bones are pinned (fixed) to the floor.  An animator adjusts the upper torso up and down, which causes the root bone of the arm chains to move.  IK resolves the arm chains to keep effector position constant while accounting for movement of the root bone.

In general, IK movements may not have a convenient, closed-form solution, so a 'solver' is supplied to a bone chain in order to resolve end-effector motion.  There are many different types of solvers, ranging from general-purpose to those applied only to two-bone chains such as arms and legs.  These are sometimes called limb solvers.

IK solvers are further classified as history-dependent or history-independent.  A history-dependent solver takes into account prior chain orientation as part of the current solution.  A history-independent solver maintains no state and is unaware of the chain's orientation prior to the current end-effector move.  History-independent solvers can be conveniently written as pure functions.

## Skins

Over the long term, this project will provide four possible ways to define a character skin, or a visual representation of the appearance of a character's limbs.  Skins may be described as segmented or continuous.  A segmented skin is a standalone graphic that maintains a 1-1 association with a single bone.  A continuous skin is associated can be associated with a single bone or a complete bone chain.

The four types of skins are

1 - Bone template (use the custom visual representation of a bone as a segmented skin)

2 - Sprite (link a bone to a sprite so that bone movement transforms the sprite)

3 - Continuous (segmented) skin.  A continuous outline with a 1-1 correspondence to a single bone

4 - Continuous (non-segmented) skin.  A continuous outline associated with an entire chain.

Bone Templates and continuous segmented skins are supported in the Beta 1.0 release.  The latter are drawn with a closed-loop, cubic Bezier spline.


## Running The Demos

There is really only one way to learn how character rigging and kinematics work and that is to deconstruct the code.  Five Angular 9 demos are provided that can be changed by selectively altering which component is used to bootstrap the Angular application.  Refer to the main app module file, _/src/app/app.module.ts_ .

```
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

  bootstrap: [FkChainTestComponent]
  // bootstrap: [CcdStepsComponent]
  // bootstrap: [IkSolverTestComponent]
  // bootstrap: [LimbSolverTestComponent]
  // bootstrap: [SkinTestComponent]
})
```

Uncomment the desired demo component and re-build the application.  

A brief summary of each demo follows,

- *FKChainTestComponent* - Successive clicks in the drawing area generate bones.  A 'hand' is forward-linked to the generated bone chain.  Click on a bone to select that bone and then adjust the slider to rotate that bone.  Note how FK is propagated forward to both subsequent bones in the chain as well as the 'hand'.

- *CcdStepsComponent* - One of the IK solvers provided with this code distribution is a modification of the classic cyclic coordinate descent algorithm.  It consists of a target phase and a solution phase.  Each step of both phases can be interactively advanced (one step at a time) by clicking on a 'Next' button.  This is a great learning tool!

- *IkSolverTestComponent* - Successive clicks in the drawing area generate bones.  A 'hand' is forward-linked to the generated bone chain.  Click and drag the hand to see the full IK solver in action.  Note the effect of mixed FK/IK in a chain; the hand need not be repositioned at the end of the IK solve since it is forward-linked to the chain.  Adjusting the terminal point of the chain from the IK solution automatically propagates to forward linkages.

- *LimbSolverTestComponent* - A 2-bone chain with joint (rotational) limits is generated.  A visual representation of the end-effector is rendered.  Drag the end effector to see how the limb solver resolves the bone orientation.  Note that some configurations are completely infeasible because rotational limits on one of the bones would be violated.  So, the chain remains in its current orientation until the end effector is moved to a feasible location.  At that point, the rig appears to 'snap' into place.

- *SkinTestComponent* - A 3-bone chain is created with a continuous, segmented skin for each bone.  Both the bone and skin are rendered (although it is possible to render only the skin).  Move the visual end effector to see both the IK solution a well as how the skin changes when bones are transformed.

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. 

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

