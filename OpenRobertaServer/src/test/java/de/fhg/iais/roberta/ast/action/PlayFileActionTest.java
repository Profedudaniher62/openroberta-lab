package de.fhg.iais.roberta.ast.action;

import org.junit.Assert;
import org.junit.Test;

import de.fhg.iais.roberta.ast.syntax.action.PlayFileAction;
import de.fhg.iais.roberta.ast.syntax.codeGeneration.Helper;
import de.fhg.iais.roberta.ast.transformer.JaxbTransformer;

public class PlayFileActionTest {

    @Test
    public void make() throws Exception {
        String a = "BlockAST [project=[[PlayFileAction [SOUNDFILE2]]]]";

        Assert.assertEquals(a, Helper.generateTransformerString("/ast/actions/action_PlayFile.xml"));
    }

    @Test
    public void getFileName() throws Exception {
        JaxbTransformer transformer = Helper.generateTransformer("/ast/actions/action_PlayFile.xml");

        PlayFileAction pfa = (PlayFileAction) transformer.getTree().get(0);

        Assert.assertEquals("SOUNDFILE2", pfa.getFileName());
    }
}
