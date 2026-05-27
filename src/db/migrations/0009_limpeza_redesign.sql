-- Migration: 0009 — Limpeza para redesign de círculos e táticas temáticas
--
-- Remove todos os Círculos antigos (serão recriados como 10 círculos pela migration 0010).
-- Remove módulos táticos manuais antigos (substituídos por módulos gerados na migration 0011).
-- Remove áreas de estratégia, finais e aberturas — o app foca exclusivamente em táticas.

-- Remove todos os Círculos (exercícios → unidades → módulos → área)
DELETE FROM exercicios WHERE id LIKE 'c-%';
DELETE FROM unidades   WHERE id LIKE 'circles-m%-u%';
DELETE FROM modulos    WHERE id LIKE 'circles-mod-%';
DELETE FROM areas      WHERE id = 'area-circulos';

-- Remove módulos táticos manuais (mod-garfo, mod-cravada, mod-espeto, mod-mate-basico)
DELETE FROM exercicios WHERE unidade_id IN (
  SELECT id FROM unidades
  WHERE modulo_id IN ('mod-garfo', 'mod-cravada', 'mod-espeto', 'mod-mate-basico')
);
DELETE FROM unidades WHERE modulo_id IN ('mod-garfo', 'mod-cravada', 'mod-espeto', 'mod-mate-basico');
DELETE FROM modulos  WHERE id IN ('mod-garfo', 'mod-cravada', 'mod-espeto', 'mod-mate-basico');

-- Remove áreas de estratégia, finais e aberturas com todo o seu conteúdo
DELETE FROM exercicios WHERE unidade_id IN (
  SELECT u.id FROM unidades u
  JOIN modulos m ON u.modulo_id = m.id
  WHERE m.area_id IN ('area-estrategia', 'area-finais', 'area-aberturas')
);
DELETE FROM unidades WHERE modulo_id IN (
  SELECT id FROM modulos WHERE area_id IN ('area-estrategia', 'area-finais', 'area-aberturas')
);
DELETE FROM modulos WHERE area_id IN ('area-estrategia', 'area-finais', 'area-aberturas');
DELETE FROM areas   WHERE id IN ('area-estrategia', 'area-finais', 'area-aberturas');
