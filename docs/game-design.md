# Lantern Run Game Design Notes

## One-sentence pitch

A first-person low-poly forest survival game where the player's lantern acts as health, timer, and weapon.

## Core fantasy

The player feels lost, hunted, and desperate to keep one small light alive while moving through a dark forest toward a glowing shrine.

## Prototype scope

The first version should stay small:

- One forest map
- One enemy
- One resource: lantern fuel
- One pickup: firefly
- One ability: lantern blast
- One goal: reach the shrine

## Main mechanic

The lantern is everything:

- It lights the world.
- It drains over time.
- It can be recharged by collecting fireflies.
- It can blast enemies away.
- It causes a loss when it reaches 0%.

This keeps the game easy to understand and easy to expand.

## Player objective

Collect enough fireflies and reach the shrine before the lantern dies or the shadow catches the player.

## Enemy behavior

The shadow creature should feel simple but scary:

- It wanders when far away.
- It chases when near the player.
- It moves faster when the lantern fuel gets low.
- It can be pushed back using lantern blast.
- It causes a loss when it reaches the player.

## Level design idea

The first map uses a clear path from spawn to shrine, but fireflies are placed slightly off the path. This makes the player choose between safety and resource collection.

## Why this is a good first project

- No complex models required yet
- No inventory system
- No combat combo system
- No dialogue system
- No multiplayer
- No database
- Fun can come from atmosphere, movement, and pressure

## Future expansion ideas

### More pickups

- Blue firefly: restores a lot of fuel
- Red firefly: gives temporary speed but attracts the shadow
- Golden firefly: rare collectible

### More lantern abilities

- Flash: briefly reveals hidden paths
- Beam: slows enemies while aiming at them
- Pulse: marks nearby fireflies

### More enemy types

- Stalker: follows slowly but never stops
- Screamer: alerts other enemies
- Shade: invisible unless lantern is high

### More levels

- Forest shrine
- Foggy swamp
- Abandoned village
- Mountain ruins
- Final temple
