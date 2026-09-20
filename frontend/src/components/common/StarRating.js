import { Star } from 'lucide-react';

export const StarRating = ({ rating, onChange, readonly = false, size = 20 }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !readonly && onChange?.(star)}
                    disabled={readonly}
                    className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                    style={{ transition: 'transform 0.2s' }}
                >
                    <Star
                        size={size}
                        className={star <= rating ? 'text-gold fill-gold' : 'text-[#EADFD6]'}
                    />
                </button>
            ))}
        </div>
    );
};
