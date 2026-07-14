import type { NextFunction, Request, Response } from 'express';
import { balanceService } from '../services/balance.service';
import type { BalancePeriodo, BalanceRango } from '../types/balance';

const PERIODOS: BalancePeriodo[] = ['7d', '30d', '90d', 'month', 'all', 'custom'];

function parsePeriodo(raw: unknown, fallback: BalancePeriodo): BalancePeriodo {
  const s = typeof raw === 'string' ? raw : fallback;
  return PERIODOS.includes(s as BalancePeriodo) ? (s as BalancePeriodo) : fallback;
}

function parseRango(query: Request['query'], fallback: BalancePeriodo): BalanceRango {
  const desde = typeof query.desde === 'string' && query.desde.trim() ? query.desde.trim() : null;
  const hasta = typeof query.hasta === 'string' && query.hasta.trim() ? query.hasta.trim() : null;
  const periodo =
    desde || hasta ? 'custom' : parsePeriodo(query.periodo, fallback);
  return { periodo, desde, hasta };
}

export const balanceController = {
  resumen(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({
        data: balanceService.getResumen(req.user!, parseRango(req.query, '90d')),
      });
    } catch (err) {
      next(err);
    }
  },

  resumenTecnico(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({
        data: balanceService.getResumenTecnico(req.user!, parseRango(req.query, 'month')),
      });
    } catch (err) {
      next(err);
    }
  },
};
