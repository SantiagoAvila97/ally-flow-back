import type { NextFunction, Request, Response } from 'express';
import { balanceService } from '../services/balance.service';
import type { BalancePeriodo } from '../types/balance';

const PERIODOS: BalancePeriodo[] = ['7d', '30d', '90d', 'month', 'all'];

function parsePeriodo(raw: unknown, fallback: BalancePeriodo): BalancePeriodo {
  const s = typeof raw === 'string' ? raw : fallback;
  return PERIODOS.includes(s as BalancePeriodo) ? (s as BalancePeriodo) : fallback;
}

export const balanceController = {
  resumen(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({
        data: balanceService.getResumen(req.user!, parsePeriodo(req.query.periodo, '90d')),
      });
    } catch (err) {
      next(err);
    }
  },

  resumenTecnico(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({
        data: balanceService.getResumenTecnico(
          req.user!,
          parsePeriodo(req.query.periodo, 'month'),
        ),
      });
    } catch (err) {
      next(err);
    }
  },
};
