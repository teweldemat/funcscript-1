namespace FuncScript.Core
{
    public partial class FuncScriptParser
    {
        /// <summary>
        /// Checks if any provided keywords are present in the input string, starting from the specified index.
        /// </summary>
        /// <param name="exp">The input string to search for keywords.</param>
        /// <param name="index">The starting index to search for keywords.</param>
        /// <param name="keyWord">Keywords to search for within the input string.</param>
        /// <returns>The index after the end of the matched keyword if found, or the same `index` if no match is found.</returns>
        /// <exception cref="ArgumentNullException">Thrown when the input expression is null.</exception>
        /// <remarks>
        /// This method uses a nested for loop for character comparison, providing better performance.
        /// </remarks>
        private static int lm_count = 0;
        static public int GetLiteralMatch(string exp, int index, params string[] keyWord)
        {
            return GetLiteralMatch(exp, index, keyWord, out var matched);
        }

        static public int GetLiteralMatch(string exp, int index, string[] keyWord, out string matched)
        {
            if (exp == null)
            {
                throw new ArgumentNullException(nameof(exp), "The input expression cannot be null.");
            }

            foreach (var k in keyWord)
            {
                bool matchFound = true;
                if (index + k.Length <= exp.Length)
                {
                    for (int i = 0; i < k.Length; i++)
                    {
                        if (char.ToLowerInvariant(exp[index + i]) != char.ToLowerInvariant(k[i]))
                        {
                            matchFound = false;
                            break;
                        }
                    }

                    if (matchFound)
                    {
                        matched = k.ToLowerInvariant();
                        return index + k.Length;
                    }
                }
            }

            matched = null;
            return index;
        }
    }
}
