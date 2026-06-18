export const WORLD_WIDTH = 920;
export const WORLD_HEIGHT = 600;

/**
 * 새 구조: 화면 한가운데가 AGORA, 그 바깥 전체가 WORD FIELD.
 * 단어는 아고라를 둘러싼 타원형 띠(annulus)에 흩뿌려진다.
 */
export const AGORA = {
  centerX: WORLD_WIDTH / 2,
  centerY: WORLD_HEIGHT / 2,
  radius: 118
};

export const FIELD = {
  // 단어가 자리잡는 타원 띠 (아고라 바깥 ~ 가장자리). 안쪽 반경은 아고라 회피 반경보다 넉넉히 크게.
  innerRadiusX: 178,
  outerRadiusX: 390,
  innerRadiusY: 152,
  outerRadiusY: 238
};

/** 아고라를 중심으로 한 타원 띠 안의 무작위 좌표. 단어 스폰에 사용. */
export function randomFieldPoint() {
  const angle = Math.random() * Math.PI * 2;
  const rx = FIELD.innerRadiusX + Math.random() * (FIELD.outerRadiusX - FIELD.innerRadiusX);
  const ry = FIELD.innerRadiusY + Math.random() * (FIELD.outerRadiusY - FIELD.innerRadiusY);
  return {
    x: AGORA.centerX + Math.cos(angle) * rx,
    y: AGORA.centerY + Math.sin(angle) * ry
  };
}
