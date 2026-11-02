// The 20 bosses. Each one has its own attack loop in update() and its own look in draw().
// Helpers (shoot, addZone, addRing, summon, moveToward...) live in fields.js.
const TAU = Math.PI * 2;

function radial(f, b, count, speed, opts, offset) {
  for (let i = 0; i < count; i++) {
    shoot(f, b.x, b.y, (offset || 0) + (TAU * i) / count, speed, Object.assign({ dmg: b.dmg, color: b.color }, opts));
  }
}

function fan(f, b, count, spread, speed, opts) {
  const mid = aimAt(b, f);
  for (let i = 0; i < count; i++) {
    const a = mid + (count > 1 ? spread * (i / (count - 1) - 0.5) : 0);
    shoot(f, b.x, b.y, a, speed, Object.assign({ dmg: b.dmg, color: b.color }, opts));
  }
}

// A line from the boss through a point, running off the arena
function lineThrough(b, x, y, length) {
  const a = Math.atan2(y - b.y, x - b.x);
  return { x1: b.x, y1: b.y, x2: b.x + Math.cos(a) * length, y2: b.y + Math.sin(a) * length, angle: a };
}

function shape(ctx, b, fill, points) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  points.forEach(([px, py], i) => {
    const x = b.x + px * b.r;
    const y = b.y + py * b.r;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

function disc(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function eyes(ctx, b, color, spread, height, size) {
  disc(ctx, b.x - b.r * spread, b.y + b.r * height, b.r * size, color);
  disc(ctx, b.x + b.r * spread, b.y + b.r * height, b.r * size, color);
}

const BOSSES = [
  {
    name: "Ember Golem",
    color: "#e0602a",
    radius: 36,
    hp: 13,
    speed: 42,
    update(b, f, dt) {
      if (b.slamIn > 0) {
        b.slamIn -= dt;
        if (b.slamIn <= 0) radial(f, b, 8, 170, { r: 7 }, f.time);
        return;
      }
      moveToward(b, f.player.x, f.player.y, b.speed, dt);
      b.cd -= dt;
      if (b.cd <= 0) {
        b.cd = 2.8;
        b.slamIn = 0.9;
        addZone(f, { kind: "circle", x: b.x, y: b.y, r: 135, delay: 0.9, life: 0.2, dmg: b.dmg * 1.2, color: "#e0602a" });
      }
    },
    draw(ctx, b) {
      shape(ctx, b, "#4a3a32", [[-1, -0.7], [-0.4, -1], [0.5, -1], [1, -0.5], [0.9, 0.8], [0.3, 1], [-0.6, 1], [-1, 0.5]]);
      ctx.strokeStyle = "#ff8a3c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x - b.r * 0.6, b.y - b.r * 0.5);
      ctx.lineTo(b.x - b.r * 0.1, b.y);
      ctx.lineTo(b.x - b.r * 0.4, b.y + b.r * 0.7);
      ctx.moveTo(b.x - b.r * 0.1, b.y);
      ctx.lineTo(b.x + b.r * 0.7, b.y + b.r * 0.2);
      ctx.stroke();
      eyes(ctx, b, "#ffd060", 0.4, -0.45, 0.13);
    },
  },
  {
    name: "Frost Wraith",
    color: "#7fd4f5",
    radius: 26,
    hp: 10,
    speed: 40,
    update(b, f, dt) {
      moveToward(b, f.player.x, f.player.y, b.speed, dt);
      b.cd -= dt;
      if (b.cd <= 0) {
        b.cd = 2.3;
        teleportAwayFromPlayer(f, b, 130, 260);
        radial(f, b, 12, 150, { r: 6, slow: 1.4 }, Math.random() * TAU);
      }
    },
    draw(ctx, b, f) {
      ctx.globalAlpha = 0.85;
      const sway = Math.sin(f.time * 4) * 0.12;
      shape(ctx, b, "#bfeaff", [[0, -1.2], [0.8, -0.2], [0.55 + sway, 1.1], [0.15, 0.7], [-0.2 + sway, 1.2], [-0.55, 0.7], [-0.8, -0.2]]);
      ctx.globalAlpha = 1;
      eyes(ctx, b, "#17405a", 0.28, -0.3, 0.13);
    },
  },
  {
    name: "Bone Colossus",
    color: "#e6dcc0",
    radius: 38,
    hp: 13,
    speed: 32,
    update(b, f, dt) {
      moveToward(b, f.player.x, f.player.y, b.speed, dt);
      b.cd -= dt;
      b.cd2 -= dt;
      if (b.cd <= 0) {
        b.cd = 5;
        if (countSummons(f) < 8) {
          for (let i = 0; i < 3; i++) {
            const a = (TAU * i) / 3 + Math.random();
            summon(f, b, { x: b.x + Math.cos(a) * 70, y: b.y + Math.sin(a) * 70, r: 12, speed: 75, hpShare: 0.05, dmgMult: 0.7, color: "#d8cfb4" });
          }
        }
      }
      if (b.cd2 <= 0) {
        b.cd2 = 1.8;
        fan(f, b, 1, 0, 230, { r: 8, color: "#f0e8d0" });
      }
    },
    draw(ctx, b) {
      disc(ctx, b.x, b.y - b.r * 0.15, b.r * 0.9, "#e6dcc0");
      ctx.fillStyle = "#e6dcc0";
      ctx.fillRect(b.x - b.r * 0.55, b.y + b.r * 0.4, b.r * 1.1, b.r * 0.6);
      ctx.fillStyle = "#2a2622";
      for (let i = 0; i < 3; i++) ctx.fillRect(b.x - b.r * 0.4 + i * b.r * 0.32, b.y + b.r * 0.55, b.r * 0.12, b.r * 0.45);
      eyes(ctx, b, "#2a2622", 0.36, -0.2, 0.24);
    },
  },
  {
    name: "Storm Serpent",
    color: "#6fa8ff",
    radius: 20,
    hp: 10,
    speed: 135,
    update(b, f, dt) {
      b.trail = b.trail || [];
      b.trail.unshift({ x: b.x, y: b.y });
      if (b.trail.length > 70) b.trail.pop();
      const wobble = Math.sin(f.time * 3.2) * 1.1;
      const a = aimAt(b, f) + wobble;
      moveToward(b, b.x + Math.cos(a) * 100, b.y + Math.sin(a) * 100, b.speed, dt);
      for (let i = 10; i < b.trail.length; i += 10) {
        const s = b.trail[i];
        if (Math.hypot(s.x - f.player.x, s.y - f.player.y) < 13 + PLAYER_RADIUS) hurtPlayer(f, b.dmg * 0.7);
      }
      b.cd -= dt;
      if (b.cd <= 0) {
        b.cd = 3;
        const p = f.player;
        for (const off of [-0.7, 0, 0.7]) {
          const len = 1400;
          addZone(f, { kind: "line", x1: p.x - Math.cos(off) * len, y1: p.y - Math.sin(off) * len, x2: p.x + Math.cos(off) * len, y2: p.y + Math.sin(off) * len, width: 16, delay: 0.85, life: 0.15, dmg: b.dmg, color: "#a8ccff" });
        }
      }
    },
    draw(ctx, b) {
      const trail = b.trail || [];
      for (let i = trail.length - (trail.length % 10 || 10); i > 0; i -= 10) {
        disc(ctx, trail[i].x, trail[i].y, 13, i % 20 ? "#3c6cc8" : "#6fa8ff");
      }
      disc(ctx, b.x, b.y, b.r, "#8fbcff");
      eyes(ctx, b, "#fff27a", 0.4, -0.2, 0.2);
    },
  },
  {
    name: "Iron Juggernaut",
    color: "#9aa2a9",
    radius: 34,
    hp: 13,
    speed: 40,
    update(b, f, dt) {
      if (!b.mode) b.mode = "walk";
      b.cd -= dt;
      b.vuln = b.mode === "stunned" ? 1.5 : 1;
      if (b.mode === "walk") {
        moveToward(b, f.player.x, f.player.y, b.speed, dt);
        if (b.cd <= 0) {
          const line = lineThrough(b, f.player.x, f.player.y, 1400);
          b.chargeAngle = line.angle;
          addZone(f, { kind: "line", x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, width: b.r * 2, delay: 0.9, life: 0, dmg: 0, color: "#ffffff" });
          b.mode = "aim";
          b.cd = 0.9;
        }
      } else if (b.mode === "aim") {
        if (b.cd <= 0) b.mode = "charge";
      } else if (b.mode === "charge") {
        const hitWall = !moveBy(f, b, Math.cos(b.chargeAngle) * 560 * dt, Math.sin(b.chargeAngle) * 560 * dt);
        if (hitWall) {
          b.mode = "stunned";
          b.cd = 1.6;
          f.shake = 8;
        }
      } else if (b.cd <= 0) {
        b.mode = "walk";
        b.cd = 1.4;
      }
    },
    draw(ctx, b) {
      ctx.fillStyle = b.mode === "stunned" ? "#c9b070" : "#7c858c";
      ctx.fillRect(b.x - b.r, b.y - b.r * 0.85, b.r * 2, b.r * 1.7);
      ctx.fillStyle = "#4c5358";
      ctx.fillRect(b.x - b.r, b.y - b.r * 0.2, b.r * 2, b.r * 0.25);
      ctx.fillStyle = b.mode === "aim" || b.mode === "charge" ? "#ff5040" : "#20252a";
      ctx.fillRect(b.x - b.r * 0.6, b.y - b.r * 0.55, b.r * 1.2, b.r * 0.2);
    },
  },
  {
    name: "Venom Queen",
    color: "#7ccf3a",
    radius: 28,
    hp: 11,
    speed: 75,
    update(b, f, dt) {
      keepRange(b, f, 230, dt);
      b.cd -= dt;
      if (b.cd <= 0) {
        b.cd = 1.5;
        addZone(f, { kind: "circle", x: f.player.x, y: f.player.y, r: 52, delay: 0.75, life: 5, dmg: b.dmg * 0.5, slow: 0.8, color: "#7ccf3a", fill: true });
      }
    },
    draw(ctx, b, f) {
      ctx.strokeStyle = "#3f6b1e";
      ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) {
        const a = (TAU * i) / 6 + Math.sin(f.time * 3 + i) * 0.15;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + Math.cos(a) * b.r * 1.5, b.y + Math.sin(a) * b.r * 1.5);
        ctx.stroke();
      }
      disc(ctx, b.x, b.y, b.r, "#5c9e2a");
      shape(ctx, b, "#ffd040", [[-0.5, -0.75], [-0.25, -1.15], [0, -0.8], [0.25, -1.15], [0.5, -0.75]]);
      eyes(ctx, b, "#d0ff60", 0.3, -0.15, 0.15);
    },
  },
  {
    name: "Mirror Knight",
    color: "#cfd8ea",
    radius: 25,
    hp: 11,
    speed: 70,
    update(b, f, dt) {
      moveToward(b, f.player.x, f.player.y, b.speed, dt);
      b.cd -= dt;
      b.cd2 -= dt;
      if (b.cd <= 0) {
        b.cd = 6.5;
        if (countSummons(f) < 4) {
          for (const side of [-1, 1]) {
            summon(f, b, {
              x: b.x + side * 110,
              y: b.y,
              r: b.r,
              speed: b.speed,
              oneHit: true,
              dmgMult: 0.6,
              color: b.color,
              draw: b.def.draw,
              ai(e, field, step) {
                moveToward(e, field.player.x, field.player.y, e.speed, step);
                e.cd -= step;
                if (e.cd <= 0) {
                  e.cd = 2;
                  fan(field, e, 1, 0, 210, { r: 6 });
                }
              },
            });
          }
        }
      }
      if (b.cd2 <= 0) {
        b.cd2 = 2;
        fan(f, b, 1, 0, 210, { r: 6 });
      }
    },
    draw(ctx, b) {
      shape(ctx, b, "#cfd8ea", [[0, -1.15], [0.85, -0.65], [0.7, 0.5], [0, 1.15], [-0.7, 0.5], [-0.85, -0.65]]);
      shape(ctx, b, "#8e9ab3", [[0, -1.15], [0.85, -0.65], [0.7, 0.5], [0, 1.15]]);
      ctx.fillStyle = "#23283a";
      ctx.fillRect(b.x - b.r * 0.5, b.y - b.r * 0.4, b.r, b.r * 0.18);
    },
  },
  {
    name: "Clockwork Titan",
    color: "#c9a648",
    radius: 40,
    hp: 14,
    speed: 60,
    update(b, f, dt) {
      moveToward(b, f.w / 2, f.h / 2, b.speed, dt);
      b.t += dt;
      const cycle = b.t % 8;
      b.beamState = cycle < 1.4 ? "warn" : cycle < 6.4 ? "on" : "off";
      b.beamAngle = (b.beamAngle || 0) + (b.beamState === "on" ? 0.75 : 0.15) * dt;
      if (b.beamState !== "on") return;
      for (let i = 0; i < 3; i++) {
        const a = b.beamAngle + (TAU * i) / 3;
        const near = distToSegment(f.player.x, f.player.y, b.x, b.y, b.x + Math.cos(a) * 1400, b.y + Math.sin(a) * 1400);
        if (near < PLAYER_RADIUS + 7) hurtPlayer(f, b.dmg);
      }
    },
    draw(ctx, b) {
      if (b.beamState !== "off") {
        ctx.strokeStyle = b.beamState === "on" ? "#ffd060" : "#ffd06055";
        ctx.lineWidth = b.beamState === "on" ? 12 : 2;
        for (let i = 0; i < 3; i++) {
          const a = (b.beamAngle || 0) + (TAU * i) / 3;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x + Math.cos(a) * 1400, b.y + Math.sin(a) * 1400);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#8a6f2c";
      for (let i = 0; i < 10; i++) {
        const a = (b.beamAngle || 0) * 2 + (TAU * i) / 10;
        disc(ctx, b.x + Math.cos(a) * b.r, b.y + Math.sin(a) * b.r, b.r * 0.2, "#8a6f2c");
      }
      disc(ctx, b.x, b.y, b.r, "#c9a648");
      disc(ctx, b.x, b.y, b.r * 0.5, "#3a2f18");
      disc(ctx, b.x, b.y, b.r * 0.2, "#ffd060");
    },
  },
  {
    name: "Shadow Stalker",
    color: "#7a5fb0",
    radius: 24,
    hp: 9,
    speed: 170,
    update(b, f, dt) {
      if (!b.mode) b.mode = "seen";
      b.cd -= dt;
      b.untargetable = b.mode === "faded";
      if (b.mode === "seen") {
        if (b.cd <= 0) {
          b.mode = "faded";
          b.cd = 1.3;
        }
      } else if (b.mode === "faded") {
        const a = f.time * 2;
        moveToward(b, f.player.x + Math.cos(a) * 170, f.player.y + Math.sin(a) * 170, b.speed, dt);
        if (b.cd <= 0) {
          const line = lineThrough(b, f.player.x, f.player.y, 420);
          b.dashAngle = line.angle;
          addZone(f, { kind: "line", x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, width: b.r * 1.6, delay: 0.55, life: 0.18, dmg: b.dmg * 1.2, color: "#b090ff" });
          b.mode = "windup";
          b.cd = 0.55;
        }
      } else if (b.mode === "windup") {
        if (b.cd <= 0) {
          b.mode = "dash";
          b.cd = 0.18;
        }
      } else {
        moveBy(f, b, Math.cos(b.dashAngle) * 2300 * dt, Math.sin(b.dashAngle) * 2300 * dt);
        if (b.cd <= 0) {
          b.mode = "seen";
          b.cd = 2.4;
        }
      }
    },
    draw(ctx, b) {
      ctx.globalAlpha = b.mode === "faded" ? 0.13 : 1;
      shape(ctx, b, "#2a2040", [[0, -1.25], [0.6, -0.5], [0.9, 1], [0.3, 0.6], [0, 1.1], [-0.3, 0.6], [-0.9, 1], [-0.6, -0.5]]);
      eyes(ctx, b, "#d0a0ff", 0.24, -0.35, 0.12);
      ctx.globalAlpha = 1;
    },
  },
  {
    name: "Magma Wyrm",
    color: "#ff5a20",
    radius: 30,
    hp: 12,
    speed: 85,
    update(b, f, dt) {
      moveToward(b, f.player.x, f.player.y, b.speed, dt);
      b.cd -= dt;
      b.cd2 -= dt;
      if (b.cd2 <= 0) {
        b.cd2 = 0.5;
        addZone(f, { kind: "circle", x: b.x, y: b.y, r: 24, delay: 0.3, life: 3.2, dmg: b.dmg * 0.5, color: "#ff5a20", fill: true });
      }
      if (b.cd <= 0) {
        b.cd = 2.6;
        // The gap never opens straight at the player, so they have to move to it
        const gap = aimAt(b, f) + (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.9);
        addRing(f, { x: b.x, y: b.y, speed: 210, width: 15, dmg: b.dmg, color: "#ff7a30", gapAngle: gap, gapSize: 0.8 });
      }
    },
    draw(ctx, b, f) {
      const jaw = 0.3 + Math.sin(f.time * 6) * 0.15;
      ctx.fillStyle = "#b03810";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, jaw, TAU - jaw);
      ctx.lineTo(b.x, b.y);
      ctx.closePath();
      ctx.fill();
      disc(ctx, b.x, b.y, b.r * 0.42, "#ffa030");
      disc(ctx, b.x - b.r * 0.1, b.y - b.r * 0.6, b.r * 0.13, "#ffe070");
    },
  },
  {
    name: "Blood Baron",
    color: "#c02040",
    radius: 26,
    hp: 11,
    speed: 62,
    update(b, f, dt) {
      keepRange(b, f, 190, dt);
      b.cd -= dt;
      b.cd2 -= dt;
      if (b.cd <= 0) {
        b.cd = 1.5;
        fan(f, b, 3, 0.5, 240, { r: 7, owner: b, heal: 0.06 });
      }
      if (b.cd2 <= 0) {
        b.cd2 = 6;
        if (countSummons(f) < 8) {
          for (let i = 0; i < 4; i++) {
            summon(f, b, { x: b.x, y: b.y, r: 8, speed: 150, hpShare: 0.015, dmgMult: 0.4, color: "#601020" });
          }
        }
      }
    },
    draw(ctx, b) {
      shape(ctx, b, "#3a0a18", [[0, -0.8], [1.2, -1], [0.85, 1.15], [0, 0.85], [-0.85, 1.15], [-1.2, -1]]);
      disc(ctx, b.x, b.y - b.r * 0.2, b.r * 0.62, "#e8d4cc");
      eyes(ctx, b, "#c02040", 0.25, -0.28, 0.1);
    },
  },
  {
    name: "Gravity Warden",
    color: "#a060ff",
    radius: 30,
    hp: 12,
    speed: 28,
    update(b, f, dt) {
      moveToward(b, f.player.x, f.player.y, b.speed, dt);
      b.t += dt;
      b.pulling = b.t % 6 > 3.8;
      if (b.pulling) {
        const a = Math.atan2(b.y - f.player.y, b.x - f.player.x);
        f.player.pushX += Math.cos(a) * 165;
        f.player.pushY += Math.sin(a) * 165;
      }
      for (let i = 0; i < 3; i++) {
        const a = f.time * 1.6 + (TAU * i) / 3;
        const x = b.x + Math.cos(a) * 95;
        const y = b.y + Math.sin(a) * 95;
        if (Math.hypot(x - f.player.x, y - f.player.y) < 13 + PLAYER_RADIUS) hurtPlayer(f, b.dmg);
      }
    },
    draw(ctx, b, f) {
      if (b.pulling) {
        ctx.strokeStyle = "#a060ff88";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r + 170 - ((f.time * 150 + i * 55) % 165), 0, TAU);
          ctx.stroke();
        }
      }
      for (let i = 0; i < 3; i++) {
        const a = f.time * 1.6 + (TAU * i) / 3;
        disc(ctx, b.x + Math.cos(a) * 95, b.y + Math.sin(a) * 95, 13, "#d0b0ff");
      }
      disc(ctx, b.x, b.y, b.r, "#1c1030");
      ctx.strokeStyle = "#a060ff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.stroke();
    },
  },
  {
    name: "Thorn Ancient",
    color: "#4f9a50",
    radius: 40,
    hp: 13,
    speed: 0,
    // While the thorns are out, every hit you land cuts you too: step out of reach to stop swinging
    onHit(b, f) {
      if (b.thorns) hurtPlayer(f, b.dmg * 0.6);
    },
    update(b, f, dt) {
      b.t += dt;
      b.thorns = b.t % 7 > 4.5;
      b.cd -= dt;
      if (b.cd <= 0) {
        b.cd = 2;
        const line = lineThrough(b, f.player.x, f.player.y, 900);
        addZone(f, { kind: "line", x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, width: 30, delay: 0.9, life: 0.35, dmg: b.dmg, color: "#6fc060" });
      }
    },
    draw(ctx, b) {
      ctx.fillStyle = b.thorns ? "#d04030" : "#2f5c30";
      const spikes = b.thorns ? 1.55 : 1.2;
      for (let i = 0; i < 12; i++) {
        const a = (TAU * i) / 12;
        ctx.beginPath();
        ctx.moveTo(b.x + Math.cos(a - 0.2) * b.r, b.y + Math.sin(a - 0.2) * b.r);
        ctx.lineTo(b.x + Math.cos(a) * b.r * spikes, b.y + Math.sin(a) * b.r * spikes);
        ctx.lineTo(b.x + Math.cos(a + 0.2) * b.r, b.y + Math.sin(a + 0.2) * b.r);
        ctx.fill();
      }
      disc(ctx, b.x, b.y, b.r, "#4f7a3a");
      eyes(ctx, b, "#e8e070", 0.32, -0.15, 0.14);
    },
  },
  {
    name: "Hive Mother",
    color: "#e0b030",
    radius: 34,
    hp: 11,
    speed: 45,
    update(b, f, dt) {
      keepRange(b, f, 260, dt);
      b.cd -= dt;
      if (b.cd <= 0) {
        b.cd = 2.6;
        if (countSummons(f) < 14) {
          summon(f, b, {
            x: b.x,
            y: b.y,
            r: 13,
            speed: 0,
            hpShare: 0.03,
            noContact: true,
            color: "#f4e0a0",
            cd: 3.6,
            ai(e, field, step) {
              e.cd -= step;
              if (e.cd > 0) return;
              e.dead = true;
              for (let i = 0; i < 4; i++) {
                summon(field, b, { x: e.x, y: e.y, r: 7, speed: 135 + i * 12, hpShare: 0.008, dmgMult: 0.35, color: "#e0b030" });
              }
            },
          });
        }
      }
    },
    draw(ctx, b, f) {
      ctx.fillStyle = "#fff4c050";
      const flap = Math.sin(f.time * 25) * 0.25;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(b.x + side * b.r * 0.8, b.y - b.r * 0.5, b.r * 0.75, b.r * 0.35, side * (0.5 + flap), 0, TAU);
        ctx.fill();
      }
      disc(ctx, b.x, b.y, b.r, "#e0b030");
      ctx.fillStyle = "#3a2c10";
      ctx.fillRect(b.x - b.r * 0.9, b.y + b.r * 0.1, b.r * 1.8, b.r * 0.22);
      ctx.fillRect(b.x - b.r * 0.72, b.y + b.r * 0.5, b.r * 1.44, b.r * 0.22);
      eyes(ctx, b, "#3a2c10", 0.34, -0.4, 0.17);
    },
  },
  {
    name: "Arcane Sentinel",
    color: "#50d0e8",
    radius: 30,
    hp: 11,
    speed: 25,
    update(b, f, dt) {
      moveToward(b, f.player.x, f.player.y, b.speed, dt);
      b.crystals = (b.crystals || []).filter((c) => !c.dead);
      b.invuln = b.crystals.length > 0;
      b.cd2 -= dt;
      if (b.cd2 <= 0) {
        b.cd2 = 2.4;
        radial(f, b, 10, 125, { r: 6 }, f.time);
      }
      if (!b.invuln) {
        b.exposed = b.exposed === undefined ? 8 : b.exposed - dt;
        if (b.exposed <= 0) {
          b.exposed = undefined;
          for (let i = 0; i < 4; i++) {
            const offset = (TAU * i) / 4;
            b.crystals.push(
              summon(f, b, {
                x: b.x,
                y: b.y,
                r: 13,
                speed: 0,
                hpShare: 0.05,
                noContact: true,
                color: "#a8f0ff",
                ai(e, field) {
                  const a = field.time * 0.9 + offset;
                  e.x = clamp(b.x + Math.cos(a) * 85, e.r, field.w - e.r);
                  e.y = clamp(b.y + Math.sin(a) * 85, e.r, field.h - e.r);
                },
              })
            );
          }
          b.invuln = true;
        }
      }
    },
    init(b) {
      b.exposed = 0; // raises the first crystal shield on the opening frame
    },
    draw(ctx, b) {
      if (b.invuln) {
        ctx.strokeStyle = "#a8f0ffcc";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 10, 0, TAU);
        ctx.stroke();
      }
      shape(ctx, b, "#2c6a80", [[0, -1.1], [1, 0], [0, 1.1], [-1, 0]]);
      disc(ctx, b.x, b.y, b.r * 0.38, "#a8f0ff");
    },
  },
  {
    name: "Plague Bell",
    color: "#a8b860",
    radius: 32,
    hp: 12,
    speed: 38,
    update(b, f, dt) {
      moveToward(b, f.player.x, f.player.y, b.speed, dt);
      b.cd -= dt;
      if (b.cd <= 0) {
        b.cd = 1.75;
        b.toll = !b.toll;
        // Tolls swap between the inner disc and the outer band, so the safe spot keeps moving
        addZone(f, b.toll
          ? { kind: "circle", x: b.x, y: b.y, r: 125, delay: 1, life: 0.22, dmg: b.dmg, color: "#c0d060", fill: true }
          : { kind: "band", x: b.x, y: b.y, r1: 125, r2: 320, delay: 1, life: 0.22, dmg: b.dmg, color: "#c0d060" });
      }
    },
    draw(ctx, b, f) {
      const tilt = Math.sin(f.time * 3.5) * 0.18;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(tilt);
      ctx.translate(-b.x, -b.y);
      shape(ctx, b, "#7c8a44", [[-0.2, -1.1], [0.2, -1.1], [0.55, -0.4], [0.7, 0.55], [1, 0.9], [-1, 0.9], [-0.7, 0.55], [-0.55, -0.4]]);
      disc(ctx, b.x, b.y + b.r * 1.05, b.r * 0.2, "#d8e090");
      ctx.restore();
    },
  },
  {
    name: "Meteor Caller",
    color: "#ff9040",
    radius: 25,
    hp: 9,
    speed: 90,
    update(b, f, dt) {
      b.t += dt;
      moveToward(b, f.w / 2 + Math.sin(b.t * 0.7) * (f.w / 2 - 60), 60, b.speed, dt);
      b.cd -= dt;
      if (b.cd <= 0) {
        b.cd = 1.35;
        addZone(f, { kind: "circle", x: f.player.x, y: f.player.y, r: 62, delay: 1, life: 0.2, dmg: b.dmg, color: "#ff9040", fill: true });
        for (let i = 0; i < 4; i++) {
          addZone(f, { kind: "circle", x: Math.random() * f.w, y: Math.random() * f.h, r: 45 + Math.random() * 30, delay: 1, life: 0.2, dmg: b.dmg, color: "#ff9040", fill: true });
        }
      }
    },
    draw(ctx, b, f) {
      shape(ctx, b, "#4a2c5c", [[0, -1], [0.75, 1.1], [-0.75, 1.1]]);
      disc(ctx, b.x, b.y - b.r * 0.45, b.r * 0.42, "#e8c8a0");
      for (let i = 0; i < 3; i++) {
        const a = f.time * 3 + (TAU * i) / 3;
        disc(ctx, b.x + Math.cos(a) * b.r * 1.35, b.y + Math.sin(a) * b.r * 1.35, 5, "#ff9040");
      }
    },
  },
  {
    name: "Phantom Duelist",
    color: "#e8e8ff",
    radius: 22,
    hp: 9,
    speed: 55,
    update(b, f, dt) {
      if (!b.mode) b.mode = "rest";
      b.cd -= dt;
      if (b.mode === "rest") {
        moveToward(b, f.player.x, f.player.y, b.speed, dt);
        if (b.cd <= 0) {
          b.combo = 3;
          b.mode = "ready";
          b.cd = 0;
        }
      } else if (b.mode === "ready") {
        const line = lineThrough(b, f.player.x, f.player.y, 400);
        b.dashAngle = line.angle;
        addZone(f, { kind: "line", x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, width: 26, delay: 0.42, life: 0.14, dmg: b.dmg * 0.9, color: "#e8e8ff" });
        b.mode = "windup";
        b.cd = 0.42;
      } else if (b.mode === "windup") {
        if (b.cd <= 0) {
          b.mode = "lunge";
          b.cd = 0.14;
        }
      } else {
        moveBy(f, b, Math.cos(b.dashAngle) * 2850 * dt, Math.sin(b.dashAngle) * 2850 * dt);
        if (b.cd <= 0) {
          b.combo--;
          b.mode = b.combo > 0 ? "ready" : "rest";
          b.cd = b.combo > 0 ? 0.12 : 2.3;
        }
      }
    },
    draw(ctx, b) {
      ctx.globalAlpha = 0.9;
      shape(ctx, b, "#d0d0f4", [[0, -1.1], [0.6, -0.1], [0.45, 1.1], [-0.45, 1.1], [-0.6, -0.1]]);
      ctx.globalAlpha = 1;
      const a = b.dashAngle || 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + Math.cos(a) * b.r * 2, b.y + Math.sin(a) * b.r * 2);
      ctx.stroke();
      eyes(ctx, b, "#4040a0", 0.22, -0.5, 0.1);
    },
  },
  {
    name: "Spiral Oracle",
    color: "#f060c0",
    radius: 28,
    hp: 11,
    speed: 40,
    update(b, f, dt) {
      moveToward(b, f.w / 2, f.h / 2, b.speed, dt);
      b.t += dt;
      b.cd -= dt;
      if (b.cd > 0) return;
      b.cd = 0.13;
      const direction = Math.floor(b.t / 6) % 2 ? -1 : 1;
      b.spin = (b.spin || 0) + direction * 0.38;
      for (const arm of [0, Math.PI]) {
        shoot(f, b.x, b.y, b.spin + arm, 130, { dmg: b.dmg * 0.6, color: "#f060c0", r: 6, life: 6 });
      }
    },
    draw(ctx, b) {
      disc(ctx, b.x, b.y, b.r, "#3c1838");
      ctx.strokeStyle = "#f060c0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = (b.spin || 0) + i * 0.32;
        const rad = (i / 40) * b.r * 0.95;
        const x = b.x + Math.cos(a) * rad;
        const y = b.y + Math.sin(a) * rad;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    },
  },
  {
    name: "Void Maw",
    color: "#6030a0",
    radius: 42,
    hp: 15,
    speed: 45,
    update(b, f, dt) {
      moveToward(b, f.w / 2, f.h / 2, b.speed, dt);
      b.t += dt;
      const full = Math.hypot(f.w, f.h) / 2 + 20;
      const c = b.t % 16;
      // Shrink, hold, then open back up: stand outside the circle and it burns
      b.safeR = c < 8 ? full - (full - 175) * (c / 8) : c < 12 ? 175 : 175 + (full - 175) * ((c - 12) / 4);
      if (Math.hypot(f.player.x - b.x, f.player.y - b.y) > b.safeR) hurtPlayer(f, b.dmg * 0.6);
      b.cd -= dt;
      if (b.cd <= 0) {
        b.cd = 2.4;
        fan(f, b, 3, 0.7, 170, { r: 8, color: "#b080ff" });
      }
    },
    draw(ctx, b, f) {
      if (b.safeR) {
        ctx.fillStyle = "#14062ad0";
        ctx.beginPath();
        ctx.rect(0, 0, f.w, f.h);
        ctx.arc(b.x, b.y, b.safeR, 0, TAU, true);
        ctx.fill();
        ctx.strokeStyle = "#a060ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.safeR, 0, TAU);
        ctx.stroke();
      }
      disc(ctx, b.x, b.y, b.r, "#0c0418");
      ctx.fillStyle = "#e8e0ff";
      for (let i = 0; i < 14; i++) {
        const a = (TAU * i) / 14 + f.time * 0.6;
        ctx.beginPath();
        ctx.moveTo(b.x + Math.cos(a - 0.14) * b.r, b.y + Math.sin(a - 0.14) * b.r);
        ctx.lineTo(b.x + Math.cos(a) * b.r * 0.68, b.y + Math.sin(a) * b.r * 0.68);
        ctx.lineTo(b.x + Math.cos(a + 0.14) * b.r, b.y + Math.sin(a + 0.14) * b.r);
        ctx.fill();
      }
    },
  },
];
