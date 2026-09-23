import { Transaction, Category, TransactionType } from '../types';
import { fromPersianDigits } from './formatters';

export interface CategorySuggestion {
  category: Category;
  confidence: number; // 0 to 100 percentage
  reasonFa: string;
  reasonEn: string;
  matchType: 'exact_history' | 'naive_bayes_text' | 'amount_distribution' | 'keyword_prior';
}

// Persian text normalizer for financial semantics
export function normalizePersianText(text: string): string {
  if (!text) return '';
  return fromPersianDigits(text)
    .toLowerCase()
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ة]/g, 'ه')
    .replace(/[آأإ]/g, 'ا')
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove diacritics
    .replace(/[\u200C\u200B]/g, ' ') // Replace zero-width non-joiners with space for token matching
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ') // Strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// Tokenize text into unigrams and bigrams
export function tokenizeText(text: string): string[] {
  const normalized = normalizePersianText(text);
  if (!normalized) return [];

  const stopWords = new Set([
    'در', 'از', 'به', 'با', 'برای', 'تا', 'که', 'و', 'یا', 'این', 'آن', 'یک', 'رو',
    'شد', 'شده', 'می', 'کرد', 'کرده', 'ای', 'های', 'را', 'بود', 'بابت', 'خرید',
    'for', 'to', 'in', 'on', 'at', 'the', 'a', 'an', 'and', 'or', 'of', 'with'
  ]);

  const words = normalized
    .split(' ')
    .filter(w => w.length > 1 && !stopWords.has(w));

  const tokens: string[] = [...words];

  // Add bigrams for contextual phrases (e.g. "خرید سوپرمارکت", "شارژ ساختمان")
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]}_${words[i + 1]}`);
  }

  return tokens;
}

// Pre-trained financial vocabulary priors for Iranian & global finance domains
const DOMAIN_KEYWORD_PRIORS: Record<string, { categoryId: string; weight: number }> = {
  // Food & Groceries
  'سوپر': { categoryId: 'cat-food', weight: 4.0 },
  'سوپرمارکت': { categoryId: 'cat-food', weight: 5.0 },
  'میوه': { categoryId: 'cat-food', weight: 4.5 },
  'تره_بار': { categoryId: 'cat-food', weight: 4.5 },
  'نان': { categoryId: 'cat-food', weight: 4.0 },
  'نانوایی': { categoryId: 'cat-food', weight: 4.5 },
  'نان_بربری': { categoryId: 'cat-food', weight: 4.5 },
  'افق': { categoryId: 'cat-food', weight: 4.5 },
  'کوروش': { categoryId: 'cat-food', weight: 4.5 },
  'هایپر': { categoryId: 'cat-food', weight: 4.0 },
  'هایپراستار': { categoryId: 'cat-food', weight: 5.0 },
  'گوشت': { categoryId: 'cat-food', weight: 4.5 },
  'مرغ': { categoryId: 'cat-food', weight: 4.5 },
  'لبنیات': { categoryId: 'cat-food', weight: 4.5 },
  'غذا': { categoryId: 'cat-food', weight: 4.0 },
  'رستوران': { categoryId: 'cat-food', weight: 5.0 },
  'فست_فود': { categoryId: 'cat-food', weight: 5.0 },
  'پیتزا': { categoryId: 'cat-food', weight: 4.5 },
  'اسنپ_فود': { categoryId: 'cat-food', weight: 5.0 },
  'قنادی': { categoryId: 'cat-food', weight: 4.0 },
  'شیرینی': { categoryId: 'cat-food', weight: 4.0 },
  'grocery': { categoryId: 'cat-food', weight: 4.5 },
  'restaurant': { categoryId: 'cat-food', weight: 4.5 },
  'food': { categoryId: 'cat-food', weight: 4.0 },

  // Transportation
  'اسنپ': { categoryId: 'cat-transport', weight: 5.0 },
  'تپسی': { categoryId: 'cat-transport', weight: 5.0 },
  'تاکسی': { categoryId: 'cat-transport', weight: 4.5 },
  'بنزین': { categoryId: 'cat-transport', weight: 5.0 },
  'جایگاه': { categoryId: 'cat-transport', weight: 4.0 },
  'گازوئيل': { categoryId: 'cat-transport', weight: 4.0 },
  'مترو': { categoryId: 'cat-transport', weight: 4.5 },
  'اتوبوس': { categoryId: 'cat-transport', weight: 4.5 },
  'روغن_موتور': { categoryId: 'cat-transport', weight: 4.5 },
  'تعویض_روغن': { categoryId: 'cat-transport', weight: 5.0 },
  'تعمیرگاه': { categoryId: 'cat-transport', weight: 4.0 },
  'مکانیک': { categoryId: 'cat-transport', weight: 4.0 },
  'کارواش': { categoryId: 'cat-transport', weight: 4.5 },
  'پارکینگ': { categoryId: 'cat-transport', weight: 4.0 },
  'عوارضی': { categoryId: 'cat-transport', weight: 4.5 },
  'خلافی': { categoryId: 'cat-transport', weight: 4.0 },
  'بلیط_هواپیما': { categoryId: 'cat-transport', weight: 4.0 },
  'بلیط_قطار': { categoryId: 'cat-transport', weight: 4.0 },
  'uber': { categoryId: 'cat-transport', weight: 4.5 },
  'fuel': { categoryId: 'cat-transport', weight: 4.5 },
  'taxi': { categoryId: 'cat-transport', weight: 4.5 },

  // Housing & Utilities
  'اجاره': { categoryId: 'cat-housing', weight: 5.0 },
  'رهن': { categoryId: 'cat-housing', weight: 5.0 },
  'قبض': { categoryId: 'cat-housing', weight: 4.5 },
  'برق': { categoryId: 'cat-housing', weight: 4.5 },
  'گاز': { categoryId: 'cat-housing', weight: 4.5 },
  'آب': { categoryId: 'cat-housing', weight: 4.5 },
  'شارژ': { categoryId: 'cat-housing', weight: 4.0 },
  'شارژ_ساختمان': { categoryId: 'cat-housing', weight: 5.0 },
  'اینترنت': { categoryId: 'cat-housing', weight: 4.5 },
  'وایفای': { categoryId: 'cat-housing', weight: 4.5 },
  'مخابرات': { categoryId: 'cat-housing', weight: 4.5 },
  'همراه_اول': { categoryId: 'cat-housing', weight: 4.0 },
  'ایرانسل': { categoryId: 'cat-housing', weight: 4.0 },
  'شاتل': { categoryId: 'cat-housing', weight: 4.5 },
  'آسیاتک': { categoryId: 'cat-housing', weight: 4.5 },
  'نظافت': { categoryId: 'cat-housing', weight: 4.0 },
  'rent': { categoryId: 'cat-housing', weight: 5.0 },
  'utilities': { categoryId: 'cat-housing', weight: 4.5 },
  'electricity': { categoryId: 'cat-housing', weight: 4.5 },

  // Health & Medical
  'دارو': { categoryId: 'cat-health', weight: 4.5 },
  'داروخانه': { categoryId: 'cat-health', weight: 5.0 },
  'دکتر': { categoryId: 'cat-health', weight: 4.5 },
  'پزشک': { categoryId: 'cat-health', weight: 4.5 },
  'ویزیت': { categoryId: 'cat-health', weight: 4.5 },
  'دندانپزشکی': { categoryId: 'cat-health', weight: 5.0 },
  'بیمارستان': { categoryId: 'cat-health', weight: 5.0 },
  'درمانگاه': { categoryId: 'cat-health', weight: 4.5 },
  'آزمایشگاه': { categoryId: 'cat-health', weight: 5.0 },
  'سونوگرافی': { categoryId: 'cat-health', weight: 5.0 },
  'رادیولوژی': { categoryId: 'cat-health', weight: 5.0 },
  'عینک': { categoryId: 'cat-health', weight: 4.0 },
  'فیزیوتراپی': { categoryId: 'cat-health', weight: 4.5 },
  'بیمه': { categoryId: 'cat-health', weight: 3.5 },
  'pharmacy': { categoryId: 'cat-health', weight: 5.0 },
  'doctor': { categoryId: 'cat-health', weight: 4.5 },
  'hospital': { categoryId: 'cat-health', weight: 4.5 },

  // Entertainment & Cafe
  'کافه': { categoryId: 'cat-entertainment', weight: 5.0 },
  'قهوه': { categoryId: 'cat-entertainment', weight: 4.5 },
  'سینما': { categoryId: 'cat-entertainment', weight: 5.0 },
  'تئاتر': { categoryId: 'cat-entertainment', weight: 5.0 },
  'کنسرت': { categoryId: 'cat-entertainment', weight: 5.0 },
  'بازی': { categoryId: 'cat-entertainment', weight: 4.0 },
  'گیم': { categoryId: 'cat-entertainment', weight: 4.0 },
  'استخر': { categoryId: 'cat-entertainment', weight: 4.5 },
  'باشگاه': { categoryId: 'cat-entertainment', weight: 4.5 },
  'سفر': { categoryId: 'cat-entertainment', weight: 4.0 },
  'تور': { categoryId: 'cat-entertainment', weight: 4.0 },
  'هتل': { categoryId: 'cat-entertainment', weight: 4.5 },
  'اقامتگاه': { categoryId: 'cat-entertainment', weight: 4.5 },
  'cafe': { categoryId: 'cat-entertainment', weight: 5.0 },
  'coffee': { categoryId: 'cat-entertainment', weight: 4.5 },
  'cinema': { categoryId: 'cat-entertainment', weight: 4.5 },

  // Shopping & Clothes
  'لباس': { categoryId: 'cat-shopping', weight: 5.0 },
  'پوشاک': { categoryId: 'cat-shopping', weight: 5.0 },
  'کفش': { categoryId: 'cat-shopping', weight: 5.0 },
  'کت': { categoryId: 'cat-shopping', weight: 4.0 },
  'شلوار': { categoryId: 'cat-shopping', weight: 4.0 },
  'دیجیکالا': { categoryId: 'cat-shopping', weight: 5.0 },
  'دیجی_کالا': { categoryId: 'cat-shopping', weight: 5.0 },
  'پاساژ': { categoryId: 'cat-shopping', weight: 4.0 },
  'لوازم': { categoryId: 'cat-shopping', weight: 3.5 },
  'آرایشی': { categoryId: 'cat-shopping', weight: 4.5 },
  'بهداشتی': { categoryId: 'cat-shopping', weight: 4.0 },
  'عطر': { categoryId: 'cat-shopping', weight: 4.5 },
  'shopping': { categoryId: 'cat-shopping', weight: 4.5 },
  'clothes': { categoryId: 'cat-shopping', weight: 4.5 },

  // Education & Books
  'کتاب': { categoryId: 'cat-education', weight: 5.0 },
  'آموزش': { categoryId: 'cat-education', weight: 4.5 },
  'دوره': { categoryId: 'cat-education', weight: 4.5 },
  'کلاس': { categoryId: 'cat-education', weight: 4.5 },
  'دانشگاه': { categoryId: 'cat-education', weight: 5.0 },
  'شهریه': { categoryId: 'cat-education', weight: 5.0 },
  'مدرسه': { categoryId: 'cat-education', weight: 5.0 },
  'فرادتیک': { categoryId: 'cat-education', weight: 4.5 },
  'مکتب_خونه': { categoryId: 'cat-education', weight: 4.5 },
  'udemy': { categoryId: 'cat-education', weight: 5.0 },
  'coursera': { categoryId: 'cat-education', weight: 5.0 },
  'book': { categoryId: 'cat-education', weight: 4.5 },

  // Loans & Installments
  'قسط': { categoryId: 'cat-installment', weight: 5.0 },
  'وام': { categoryId: 'cat-installment', weight: 5.0 },
  'بدهی': { categoryId: 'cat-installment', weight: 4.5 },
  'اسنپ_پی': { categoryId: 'cat-installment', weight: 4.5 },
  'دیجی_پی': { categoryId: 'cat-installment', weight: 4.5 },
  'اقساط': { categoryId: 'cat-installment', weight: 5.0 },
  'loan': { categoryId: 'cat-installment', weight: 5.0 },
  'installment': { categoryId: 'cat-installment', weight: 5.0 },

  // Incomes
  'حقوق': { categoryId: 'cat-salary', weight: 5.0 },
  'دستمزد': { categoryId: 'cat-salary', weight: 5.0 },
  'مساعده': { categoryId: 'cat-salary', weight: 4.5 },
  'واریز_حقوق': { categoryId: 'cat-salary', weight: 5.0 },
  'salary': { categoryId: 'cat-salary', weight: 5.0 },
  'wage': { categoryId: 'cat-salary', weight: 5.0 },

  'فریلنس': { categoryId: 'cat-freelance', weight: 5.0 },
  'پروژه': { categoryId: 'cat-freelance', weight: 5.0 },
  'طراحی': { categoryId: 'cat-freelance', weight: 4.0 },
  'برنامه_نویسی': { categoryId: 'cat-freelance', weight: 4.5 },
  'مشاوره': { categoryId: 'cat-freelance', weight: 4.0 },
  'freelance': { categoryId: 'cat-freelance', weight: 5.0 },

  'سود': { categoryId: 'cat-investment', weight: 4.5 },
  'سود_بانکی': { categoryId: 'cat-investment', weight: 5.0 },
  'سود_سهام': { categoryId: 'cat-investment', weight: 5.0 },
  'بورس': { categoryId: 'cat-investment', weight: 4.5 },
  'صندوق': { categoryId: 'cat-investment', weight: 4.0 },
  'سود_صندوق': { categoryId: 'cat-investment', weight: 5.0 },
  'طلا': { categoryId: 'cat-investment', weight: 4.0 },
  'investment': { categoryId: 'cat-investment', weight: 4.5 },
  'dividend': { categoryId: 'cat-investment', weight: 5.0 },

  'پاداش': { categoryId: 'cat-gift', weight: 4.5 },
  'عیدی': { categoryId: 'cat-gift', weight: 5.0 },
  'کادو': { categoryId: 'cat-gift', weight: 4.5 },
  'هدیه': { categoryId: 'cat-gift', weight: 4.5 },
  'gift': { categoryId: 'cat-gift', weight: 4.5 },
  'bonus': { categoryId: 'cat-gift', weight: 4.5 },
};

/**
 * Machine Learning Category Suggestion Model
 * Evaluates historical user transactions with:
 * 1. Exact/fuzzy historical match on description
 * 2. Multinomial Naive Bayes text likelihood with Laplace smoothing
 * 3. Pre-trained domain prior weighting
 * 4. Gaussian log-scale amount compatibility
 */
export class TransactionCategoryClassifier {
  private transactions: Transaction[];
  private categories: Category[];
  private categoryMap: Map<string, Category>;

  // Model parameters computed from user's historical transactions
  private categoryPriors: Map<string, number> = new Map();
  private tokenFrequencies: Map<string, Map<string, number>> = new Map(); // categoryId -> (token -> count)
  private categoryTokenTotals: Map<string, number> = new Map();
  private vocabulary: Set<string> = new Set();
  private amountStats: Map<string, { meanLog: number; stdLog: number; count: number }> = new Map();

  constructor(transactions: Transaction[], categories: Category[]) {
    this.transactions = transactions;
    this.categories = categories;
    this.categoryMap = new Map(categories.map(c => [c.id, c]));
    this.train();
  }

  // Model Training step
  private train() {
    if (this.transactions.length === 0) return;

    // 1. Group transactions by category
    const catCounts = new Map<string, number>();
    const catAmounts = new Map<string, number[]>();

    this.transactions.forEach(tx => {
      if (!tx.categoryId) return;
      catCounts.set(tx.categoryId, (catCounts.get(tx.categoryId) || 0) + 1);

      if (!catAmounts.has(tx.categoryId)) {
        catAmounts.set(tx.categoryId, []);
      }
      if (tx.amount > 0) {
        catAmounts.get(tx.categoryId)!.push(Math.log(tx.amount));
      }

      // Tokenize historical description
      const tokens = tokenizeText(tx.description || '');
      if (!this.tokenFrequencies.has(tx.categoryId)) {
        this.tokenFrequencies.set(tx.categoryId, new Map());
        this.categoryTokenTotals.set(tx.categoryId, 0);
      }

      const freqMap = this.tokenFrequencies.get(tx.categoryId)!;
      tokens.forEach(tok => {
        this.vocabulary.add(tok);
        freqMap.set(tok, (freqMap.get(tok) || 0) + 1);
        this.categoryTokenTotals.set(
          tx.categoryId,
          (this.categoryTokenTotals.get(tx.categoryId) || 0) + 1
        );
      });
    });

    // 2. Compute priors P(Category)
    const totalTx = this.transactions.length;
    catCounts.forEach((count, catId) => {
      this.categoryPriors.set(catId, count / totalTx);
    });

    // 3. Compute amount distribution stats (Log-Normal parameters per category)
    catAmounts.forEach((logAmounts, catId) => {
      if (logAmounts.length > 0) {
        const mean = logAmounts.reduce((a, b) => a + b, 0) / logAmounts.length;
        const variance =
          logAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          Math.max(1, logAmounts.length);
        this.amountStats.set(catId, {
          meanLog: mean,
          stdLog: Math.max(0.4, Math.sqrt(variance)),
          count: logAmounts.length,
        });
      }
    });
  }

  /**
   * Predict category for a candidate transaction
   */
  public predict(
    description: string,
    amount: number,
    type: TransactionType
  ): CategorySuggestion[] {
    const candidateCategories = this.categories.filter(c => c.type === type);
    if (candidateCategories.length === 0) return [];

    const normInput = normalizePersianText(description);
    const tokens = tokenizeText(description);

    // 1. Exact or near-exact match on user's past transactions
    if (normInput.length >= 2) {
      const exactPastTx = this.transactions.find(tx => {
        if (tx.type !== type || !tx.description) return false;
        const normTxDesc = normalizePersianText(tx.description);
        return normTxDesc === normInput || normTxDesc.includes(normInput) || normInput.includes(normTxDesc);
      });

      if (exactPastTx) {
        const matchedCat = this.categoryMap.get(exactPastTx.categoryId);
        if (matchedCat && matchedCat.type === type) {
          const suggestions: CategorySuggestion[] = [
            {
              category: matchedCat,
              confidence: 96,
              reasonFa: `انطباق کامل با سابقه تراکنش: «${exactPastTx.description}»`,
              reasonEn: `Exact match with past transaction: "${exactPastTx.description}"`,
              matchType: 'exact_history',
            }
          ];

          // Add secondaries if available
          const remaining = candidateCategories
            .filter(c => c.id !== matchedCat.id)
            .slice(0, 2);
          remaining.forEach(rc => {
            suggestions.push({
              category: rc,
              confidence: 30,
              reasonFa: 'دسته‌بندی جایگزین',
              reasonEn: 'Alternative option',
              matchType: 'naive_bayes_text'
            });
          });

          return suggestions;
        }
      }
    }

    // 2. Multinomial Naive Bayes + Domain Priors Scoring
    const scores: { catId: string; logScore: number; reasonFa: string; reasonEn: string; matchType: CategorySuggestion['matchType'] }[] = [];
    const vocabSize = Math.max(10, this.vocabulary.size);

    candidateCategories.forEach(cat => {
      const prior = this.categoryPriors.get(cat.id) || 0.05;
      let logScore = Math.log(prior + 0.01);
      let matchedKeywordCount = 0;
      let matchedKeywords: string[] = [];

      const freqMap = this.tokenFrequencies.get(cat.id);
      const totalTokensInCat = this.categoryTokenTotals.get(cat.id) || 0;

      tokens.forEach(token => {
        // A. From historical model (user data)
        const tokenCount = freqMap ? (freqMap.get(token) || 0) : 0;
        // Laplace smoothing: (count + 1) / (totalTokens + vocabSize)
        const pTokenGivenCat = (tokenCount + 0.1) / (totalTokensInCat + vocabSize * 0.1);
        logScore += Math.log(pTokenGivenCat) * 1.5;

        if (tokenCount > 0) {
          matchedKeywordCount++;
          matchedKeywords.push(token);
        }

        // B. From domain prior dictionary
        const domainPrior = DOMAIN_KEYWORD_PRIORS[token];
        if (domainPrior && domainPrior.categoryId === cat.id) {
          logScore += domainPrior.weight * 2.2;
          matchedKeywordCount += 2;
          if (!matchedKeywords.includes(token)) {
            matchedKeywords.push(token);
          }
        }
      });

      // C. Amount compatibility weighting
      if (amount > 0) {
        const stats = this.amountStats.get(cat.id);
        if (stats && stats.count >= 2) {
          const logAmount = Math.log(amount);
          const zScore = Math.abs(logAmount - stats.meanLog) / stats.stdLog;
          // Gaussian penalty
          const amountLikelihood = Math.exp(-0.5 * Math.min(6, zScore * zScore));
          logScore += Math.log(amountLikelihood + 0.05) * 0.8;
        }
      }

      let reasonFa = 'برآورد شده با مدل یادگیری ماشین و رفتار مخارج شما';
      let reasonEn = 'Estimated via ML model & spending history';
      let matchType: CategorySuggestion['matchType'] = 'naive_bayes_text';

      if (matchedKeywords.length > 0) {
        reasonFa = `تشابه واژگانی در شرح تراکنش: «${matchedKeywords.slice(0, 2).join('، ')}»`;
        reasonEn = `Lexical keywords match: "${matchedKeywords.slice(0, 2).join(', ')}"`;
        matchType = 'keyword_prior';
      } else if (amount > 0 && this.amountStats.has(cat.id)) {
        reasonFa = `تناسب بازه مبلغ با میانگین تاریخی این دسته`;
        reasonEn = `Amount matches historical range for this category`;
        matchType = 'amount_distribution';
      }

      scores.push({
        catId: cat.id,
        logScore,
        reasonFa,
        reasonEn,
        matchType,
      });
    });

    // 3. Softmax conversion to probabilities (0% - 100%)
    if (scores.length === 0) return [];

    const maxLog = Math.max(...scores.map(s => s.logScore));
    const expScores = scores.map(s => ({
      ...s,
      exp: Math.exp(s.logScore - maxLog),
    }));
    const totalExp = expScores.reduce((sum, s) => sum + s.exp, 0);

    const sorted = expScores
      .map(s => {
        const probability = Math.round((s.exp / Math.max(0.0001, totalExp)) * 100);
        const cat = this.categoryMap.get(s.catId)!;
        return {
          category: cat,
          confidence: Math.min(98, Math.max(15, probability)),
          reasonFa: s.reasonFa,
          reasonEn: s.reasonEn,
          matchType: s.matchType,
        };
      })
      .sort((a, b) => b.confidence - a.confidence);

    return sorted.slice(0, 3);
  }
}
