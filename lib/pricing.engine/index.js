class PricingEngine {
  constructor(config = {}) {
    this.baseRate = config.baseRate || 100;
    this.markup = config.markup || 1.2;
    this.urgentMultiplier = config.urgentMultiplier || 1.5;
    this.minPrice = config.minPrice || 50;
  }

  calculateBaseCost(job) {
    const hours = job.hours || 1;
    const rate = job.rate || this.baseRate;
    return hours * rate;
  }

  applyComplexity(cost, complexity) {
    if (!complexity) return cost;
    return cost * complexity;
  }

  applyMarkup(cost) {
    return cost * this.markup;
  }

  applyUrgency(cost, isUrgent) {
    if (!isUrgent) return cost;
    return cost * this.urgentMultiplier;
  }

  applyMinimum(cost) {
    return Math.max(cost, this.minPrice);
  }

  calculate(job) {
    let cost = this.calculateBaseCost(job);

    cost = this.applyComplexity(cost, job.complexity);
    cost += job.materialsCost || 0;
    cost = this.applyMarkup(cost);
    cost = this.applyUrgency(cost, job.isUrgent);
    cost = this.applyMinimum(cost);

    return {
      total: cost,
      breakdown: {
        hours: job.hours || 1,
        rate: job.rate || this.baseRate,
        complexity: job.complexity || 1,
        materialsCost: job.materialsCost || 0,
        isUrgent: !!job.isUrgent
      }
    };
  }
}

const pricingEngine = new PricingEngine();

module.exports = pricingEngine;