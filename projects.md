# Projects:
## Project 1: Pygame ball physics
<iframe width="560" height="315" src="https://drive.google.com/file/d/1qkxndQWLZGwugsT9RIgLM-NNatp-nrVU/view?usp=sharing" frameborder="0" allowfullscreen></iframe>
This is a cool project in pygame with physics! You can apply an impulse to a ball and watch it bounce around the window.

<details>
  <summary>Source code</summary>
  
```python
import pygame

GRAVITY = 300
ELASTICITY = 0.8
BALL_RADIUS = 40
IMPULSE = 300

SCREEN_BOUNDS_X = 1280
SCREEN_BOUNDS_Y = 720

pygame.init()
screen = pygame.display.set_mode((SCREEN_BOUNDS_X, SCREEN_BOUNDS_Y))
clock = pygame.time.Clock()

font = pygame.font.Font(None, 36)

running = True
dt = 0

ball_pos = pygame.Vector2(
    screen.get_width() / 2,
    screen.get_height() / 2
)

xVelocity = 0
yVelocity = 0

while running:

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill("purple")

    # physics
    # gravity changes velocity
    yVelocity += GRAVITY * dt

    # Velocity changes position
    ball_pos.x += xVelocity * dt
    ball_pos.y += yVelocity * dt

    # account for the ball size
    floor = SCREEN_BOUNDS_Y - BALL_RADIUS

    # ceiling
    if ball_pos.y <= BALL_RADIUS:
        print("ball hit ceiling!")
        ball_pos.y = BALL_RADIUS
        yVelocity = -yVelocity * ELASTICITY

    # floor
    if ball_pos.y >= SCREEN_BOUNDS_Y - BALL_RADIUS:
        print("ball hit floor!")
        ball_pos.y = SCREEN_BOUNDS_Y - BALL_RADIUS
        yVelocity = -yVelocity * ELASTICITY

    # left wall
    if ball_pos.x <= BALL_RADIUS:
        print("ball hit LEFT wall!")
        ball_pos.x = BALL_RADIUS
        xVelocity = -xVelocity * ELASTICITY

    # right wall
    if ball_pos.x >= SCREEN_BOUNDS_X - BALL_RADIUS:
        print("ball hit RIGHT wall!")
        ball_pos.x = SCREEN_BOUNDS_X - BALL_RADIUS
        xVelocity = -xVelocity * ELASTICITY

    pygame.draw.circle(
        screen,
        "red",
        ball_pos,
        BALL_RADIUS
    )

    velocity_text = font.render(
        f"X Velocity: {xVelocity:.2f}  Y Velocity: {yVelocity:.2f}",
        True,
        "white"
    )

    keys = pygame.key.get_pressed()
    if keys[pygame.K_w]:
        print("upper impulse applied")
        yVelocity -= IMPULSE
    if keys[pygame.K_s]:
        print("lower impulse applied")
        yVelocity += IMPULSE
    if keys[pygame.K_a]:
        print("left impulse applied")
        xVelocity -= IMPULSE
    if keys[pygame.K_d]:
        print("right impulse applied")
        xVelocity += IMPULSE

    screen.blit(velocity_text, (10, 10))

    pygame.display.flip()

    dt = clock.tick(60) / 1000

pygame.quit()
```
</details>
